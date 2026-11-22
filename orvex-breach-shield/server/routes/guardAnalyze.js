
import { Router } from 'express'
import {
  extractUrl,
  analyzeUrlFeatures
} from '../guardAnalysis.js'
import {
  analyzeGuardTextWithAI,
  isGuardAIConfigured
} from '../guardOpenAI.js'

const router = Router()

// BLOCCO DI SICUREZZA:
// Non attivare le chiamate AI prima di avere
// limiti giornalieri e controlli sui costi.
const AI_REQUESTS_ENABLED = false

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

    const cleanText = text.trim()
    const url = extractUrl(cleanText)

    // Analisi preliminare URL senza costi API.
    if (url) {
      const analysis = analyzeUrlFeatures(url)

      return res.json({
        ...analysis,
        analyzedUrl: url,
        plan: 'test',
        preliminary: true
      })
    }

    // Analisi AI temporaneamente bloccata.
    if (!AI_REQUESTS_ENABLED) {
      return res.status(503).json({
        error: 'Analisi AI temporaneamente disattivata',
        preliminary: true
      })
    }

    if (!isGuardAIConfigured()) {
      return res.status(503).json({
        error: 'Analisi AI non configurata'
      })
    }

    // Questa parte sarà utilizzata soltanto dopo
    // l'implementazione dei limiti di utilizzo.
    const aiResult = await analyzeGuardTextWithAI(cleanText)

    if (!aiResult.available) {
      return res.status(503).json({
        error: 'Analisi AI non disponibile'
      })
    }

    return res.json({
      ...aiResult.result,
      plan: 'test',
      preliminary: false
    })
  } catch (error) {
    next(error)
  }
})

export default router
