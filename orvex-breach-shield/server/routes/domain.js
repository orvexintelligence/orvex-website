// ─────────────────────────────────────────────────────────────────
//  ORVEX — Route /api/domain
//
//  GET /api/domain/scan?domain=example.com
//    → applica il limite gratuito lato server
//    → interroga il provider Domain Watch configurato
//    → restituisce un profilo dominio utilizzabile dal frontend
// ─────────────────────────────────────────────────────────────────

import { Router } from 'express'
import { checkFreeScan } from '../utils/freeScanLimit.js'

const router = Router()
const PAYMENT_URL = process.env.DOMAIN_PAYMENT_URL || process.env.VITE_DOMAIN_STRIPE_MONTHLY_EUR || ''
const PROVIDER_URL = (process.env.DOMAIN_SCAN_PROVIDER_URL || 'https://orvex-server.onrender.com/api/domain/scan').replace(/\/$/, '')

function cleanDomain(value = '') {
  return String(value)
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .toLowerCase()
}

function isValidDomain(domain) {
  return /^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain) && !domain.includes('..')
}

router.get('/scan', async (req, res) => {
  const domain = cleanDomain(req.query.domain)

  if (!domain || !isValidDomain(domain)) {
    return res.status(400).json({ error: 'Dominio non valido' })
  }

  const usagePreview = checkFreeScan(req, 'domain', domain)
  if (!usagePreview.allowed) {
    return res.status(402).json({
      error: 'Scansione gratuita Domain Watch già utilizzata. Attiva Domain Watch Premium per continuare.',
      code: 'FREE_LIMIT_REACHED',
      paymentRequired: true,
      paymentUrl: PAYMENT_URL,
      usage: usagePreview,
    })
  }

  try {
    const response = await fetch(`${PROVIDER_URL}?domain=${encodeURIComponent(domain)}`, {
      headers: { 'User-Agent': 'Orvex-Domain-Watch/1.0' },
      signal: AbortSignal.timeout(15000),
    })

    let data = null
    try {
      data = await response.json()
    } catch {
      data = null
    }

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error || `Provider Domain Watch non disponibile (${response.status})`,
      })
    }

    const usage = checkFreeScan(req, 'domain', domain, true)
    return res.json({
      ...data,
      domain,
      source: 'domain_watch_api',
      usage,
    })
  } catch (err) {
    console.error('[Domain Watch] Fetch error:', err.message)
    return res.status(503).json({ error: 'Motore Domain Watch temporaneamente non disponibile.' })
  }
})

export default router
