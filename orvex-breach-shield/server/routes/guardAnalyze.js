
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

// AI sempre disattivata in questa versione.
const AI_REQUESTS_ENABLED = false

// I limiti possono essere testati soltanto in locale.
// In produzione il test rimane disabilitato.
const USAGE_LIMITS_ENABLED =
  process.env.GUARD_USAGE_TEST_MODE === 'enabled' &&
  process.env.NODE_ENV !== 'production'

function isLocalConnection(req) {
  const address = req.socket?.remoteAddress || ''

  return (
    address === '127.0.0.1' ||
    address === '::1' ||
    address === '::ffff:127.0.0.1'
  )
}

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

    // Impedisce l'uso remoto della modalità di test.
    if (USAGE_LIMITS_ENABLED && !isLocalConnection(req)) {
      return res.status(403).json({
        error: 'Modalità di test disponibile solo in locale'
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

    // I testi senza URL richiedono l'AI.
    // Non consumiamo il contatore se l'AI è disattivata.
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

    let remaining = null

    // Conteggio effettivo soltanto nei test locali.
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
        const limitReached =
          usage.error === 'Limite giornaliero raggiunto'

        return res.status(limitReached ? 429 : 503).json({
          error: usage.error,
          upgradeRequired: limitReached
        })
      }

      remaining = usage.remaining
    }

    // Analisi preliminare URL, senza OpenAI.
    if (url) {
      const analysis = analyzeUrlFeatures(url)

      return res.json({
        ...analysis,
        analyzedUrl: url,
        plan: user ? 'authenticated-test' : 'guest-test',
        preliminary: true,
        usageLimitsActive: USAGE_LIMITS_ENABLED,
        remaining
      })
    }

    // Non raggiungibile finché AI_REQUESTS_ENABLED è false.
    const aiResult = await analyzeGuardTextWithAI(cleanText)

    if (!aiResult.available) {
      return res.status(503).json({
        error: 'Analisi AI non disponibile'
      })
    }

    return res.json({
      ...aiResult.result,
      plan: user ? 'authenticated-test' : 'guest-test',
      preliminary: false,
      remaining
    })
  } catch (error) {
    next(error)
  }
})

export default router
