
import { Router } from 'express'
import {
  extractUrl,
  analyzeUrlFeatures
} from '../guardAnalysis.js'
import {
  analyzeGuardTextWithAI,
  isGuardAIConfigured
} from '../guardOpenAI.js'
import { verifyGuardToken } from '../supabaseGuard.js'
import { getGuardGuestKey } from '../guardGuest.js'
import { consumeGuardUsage } from '../guardUsage.js'

const router = Router()

// Sicurezza: AI disattivata finché non saranno
// completati i controlli sui costi.
const AI_REQUESTS_ENABLED = false

// Sicurezza: contatore disattivato fino al test
// con credenziali server e proxy correttamente configurato.
const USAGE_LIMITS_ENABLED = false

router.post('/text', async (req, res, next) => {
  try {
    const { text } = req.body ?? {}

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        error: 'Testo mancante'
      })
    }

    if (text.length > 10000) {
      return res.status(413).json({
        error: 'Testo troppo lungo'
      })
    }

    const authorization = req.headers.authorization || ''
    let user = null

    if (authorization) {
      const match = authorization.match(/^Bearer\s+(.+)$/i)

      if (!match) {
        return res.status(401).json({
          error: 'Autenticazione non valida'
        })
      }

      user = await verifyGuardToken(match[1].trim())

      if (!user) {
        return res.status(401).json({
          error: 'Token non valido o scaduto'
        })
      }
    }

    const cleanText = text.trim()
    const url = extractUrl(cleanText)

    // L'analisi dei messaggi richiede l'AI.
    // Finché è disattivata, non consumiamo il contatore.
    if (!url && !AI_REQUESTS_ENABLED) {
      return res.status(503).json({
        error: 'Analisi AI temporaneamente disattivata'
      })
    }

    if (!url && !isGuardAIConfigured()) {
      return res.status(503).json({
        error: 'Analisi AI non configurata'
      })
    }

    // Quando attiveremo i limiti, nessuna analisi
    // potrà procedere senza un conteggio valido.
    if (USAGE_LIMITS_ENABLED) {
      const principalKey = user
        ? `user:${user.id}`
        : getGuardGuestKey(req)

      const dailyLimit = user ? 3 : 2

      const usage = await consumeGuardUsage(
        principalKey,
        dailyLimit
      )

      if (!usage.allowed) {
        const unavailable =
          usage.error !== 'Limite giornaliero raggiunto'

        return res.status(unavailable ? 503 : 429).json({
          error: usage.error,
          upgradeRequired: !unavailable
        })
      }
    }

    // Analisi preliminare URL.
    // Non utilizza OpenAI.
    if (url) {
      const analysis = analyzeUrlFeatures(url)

      return res.json({
        ...analysis,
        analyzedUrl: url,
        plan: user ? 'authenticated-test' : 'guest-test',
        preliminary: true,
        usageLimitsActive: USAGE_LIMITS_ENABLED
      })
    }

    // Analisi AI: non raggiungibile durante i test
    // perché AI_REQUESTS_ENABLED è false.
    const aiResult = await analyzeGuardTextWithAI(cleanText)

    if (!aiResult.available) {
      return res.status(503).json({
        error: 'Analisi AI non disponibile'
      })
    }

    return res.json({
      ...aiResult.result,
      plan: user ? 'authenticated-test' : 'guest-test',
      preliminary: false
    })
  } catch (error) {
    next(error)
  }
})

export default router
