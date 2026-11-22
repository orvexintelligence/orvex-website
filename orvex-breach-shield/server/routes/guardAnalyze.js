import { Router } from 'express'
import { extractUrl, analyzeUrlFeatures } from '../guardAnalysis.js'
import { analyzeGuardTextWithAI, isGuardAIConfigured } from '../guardOpenAI.js'
import { verifyGuardToken } from '../supabaseGuard.js'
import { getGuardGuestKey } from '../guardGuest.js'
import { consumeGuardUsage } from '../guardUsage.js'

const router = Router()

// L'AI si abilita soltanto con una scelta esplicita sul server.
// I limiti Supabase si applicano SEMPRE, anche in produzione.
const aiEnabled = () =>
  process.env.GUARD_AI_ENABLED === 'true' && isGuardAIConfigured()

function aiDailyCap() {
  const n = Number(process.env.GUARD_AI_DAILY_CAP || 20)
  return Number.isInteger(n) && n >= 1 && n <= 100 ? n : 20
}

function limitResponse(res, usage) {
  const reached = usage.error === 'Limite giornaliero raggiunto'
  return res.status(reached ? 429 : 503).json({
    error: reached ? 'Limite giornaliero raggiunto' : 'Controllo disponibilita non riuscito',
    upgradeRequired: reached
  })
}

router.post('/text', async (req, res, next) => {
  try {
    const { text } = req.body ?? {}
    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({ error: 'Testo mancante' })
    }
    // Limite di input per contenere il costo delle chiamate AI.
    if (text.length > 4000) {
      return res.status(413).json({ error: 'Testo troppo lungo (massimo 4000 caratteri)' })
    }

    const authorization = req.headers.authorization || ''
    let user = null
    if (authorization) {
      const match = authorization.match(/^Bearer\s+(.+)$/i)
      if (!match) return res.status(401).json({ error: 'Autenticazione non valida' })
      user = await verifyGuardToken(match[1].trim())
      if (!user) return res.status(401).json({ error: 'Token non valido o scaduto' })
    }

    const cleanText = text.trim()
    const url = extractUrl(cleanText)
    const useAI = aiEnabled()

    // Se manca l'AI, non fingere che un semplice testo sia analizzabile.
    if (!url && !useAI) {
      return res.status(503).json({ error: 'Analisi AI temporaneamente non disponibile' })
    }

    // Dietro Render, req.ip deve essere verificato PRIMA di usarlo per i limiti ospiti.
    // Bloccare gli ospiti evita sia un limite condiviso tra tutti sia spoofing degli IP.
    if (!user && process.env.NODE_ENV === 'production' &&
        process.env.GUARD_GUEST_IP_VERIFIED !== 'true') {
      return res.status(503).json({ error: 'Analisi ospiti temporaneamente non disponibile' })
    }

    const principalKey = user ? `user:${user.id}` : getGuardGuestKey(req)
    // Prudenza: tutti gli account autenticati hanno limite free finche Stripe
    // non convalida i diritti Premium dal lato server.
    const dailyLimit = user ? 3 : 2
    const usage = await consumeGuardUsage(principalKey, dailyLimit)
    if (!usage.allowed) return limitResponse(res, usage)

    if (!useAI) {
      // Questo e' un controllo preliminare del link, NON una scansione AI completa.
      return res.json({
        ...analyzeUrlFeatures(url),
        analyzedUrl: url,
        preliminary: true,
        usageLimitsActive: true,
        remaining: usage.remaining
      })
    }

    // Seconda soglia globale: limita il numero totale di chiamate AI per giorno,
    // anche se le richieste arrivano da molti indirizzi IP diversi.
    const globalUsage = await consumeGuardUsage('system:guard-ai', 3)
    if (!globalUsage.allowed) {
      return res.status(globalUsage.error === 'Limite giornaliero raggiunto' ? 429 : 503).json({
        error: 'Capacita AI giornaliera esaurita o temporaneamente non disponibile'
      })
    }

    const aiResult = await analyzeGuardTextWithAI(cleanText)
    if (!aiResult?.available || !aiResult.result ||
        typeof aiResult.result !== 'object') {
      return res.status(503).json({ error: 'Analisi AI non disponibile' })
    }

    return res.json({
      ...aiResult.result,
      preliminary: false,
      usageLimitsActive: true,
      remaining: usage.remaining
    })
  } catch (error) {
    next(error)
  }
})

export default router
