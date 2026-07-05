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
const PROVIDER_URL = (process.env.DOMAIN_SCAN_PROVIDER_URL || '').replace(/\/$/, '')

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

async function scanWithProvider(domain) {
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
    const error = new Error(data?.error || `Provider Domain Watch non disponibile (${response.status})`)
    error.status = response.status
    throw error
  }

  return { ...data, source: 'domain_watch_provider' }
}

async function scanWithVirusTotal(domain) {
  const apiKey = process.env.VIRUSTOTAL_API_KEY
  if (!apiKey) {
    const error = new Error('VIRUSTOTAL_API_KEY non configurata')
    error.status = 503
    throw error
  }

  const response = await fetch(`https://www.virustotal.com/api/v3/domains/${encodeURIComponent(domain)}`, {
    headers: { 'x-apikey': apiKey, Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  })

  if (response.status === 404) {
    return {
      domain,
      found: false,
      healthScore: 100,
      malicious: 0,
      suspicious: 0,
      harmless: 0,
      undetected: 0,
      categories: [],
      reputation: 0,
      threatLevel: 'BASSO',
      lastAnalysis: null,
      source: 'virustotal',
    }
  }

  if (!response.ok) {
    const error = new Error(`VirusTotal API error: ${response.status}`)
    error.status = response.status
    throw error
  }

  const data = await response.json()
  const attr = data.data?.attributes || {}
  const stats = attr.last_analysis_stats || {}
  const malicious = stats.malicious || 0
  const suspicious = stats.suspicious || 0
  const harmless = stats.harmless || 0
  const undetected = stats.undetected || 0
  const total = malicious + suspicious + harmless + undetected || 1
  const riskScore = ((malicious * 2 + suspicious) / total) * 100
  const healthScore = Math.max(0, Math.round(100 - riskScore))
  const categories = attr.categories ? Object.values(attr.categories) : []

  let threatLevel = 'BASSO'
  if (malicious >= 5) threatLevel = 'CRITICO'
  else if (malicious >= 2) threatLevel = 'ALTO'
  else if (malicious >= 1 || suspicious >= 3) threatLevel = 'MEDIO'

  return {
    domain,
    found: true,
    healthScore,
    malicious,
    suspicious,
    harmless,
    undetected,
    reputation: attr.reputation || 0,
    categories: [...new Set(categories)].slice(0, 5),
    threatLevel,
    lastAnalysis: attr.last_analysis_date ? new Date(attr.last_analysis_date * 1000).toISOString() : null,
    registrar: attr.registrar || null,
    country: attr.country || null,
    creationDate: attr.creation_date ? new Date(attr.creation_date * 1000).toISOString() : null,
    source: 'virustotal',
  }
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
    const data = PROVIDER_URL ? await scanWithProvider(domain) : await scanWithVirusTotal(domain)
    const usage = checkFreeScan(req, 'domain', domain, true)
    return res.json({
      ...data,
      domain,
      usage,
    })
  } catch (err) {
    console.error('[Domain Watch] Fetch error:', err.message)
    return res.status(err.status || 503).json({ error: 'Motore Domain Watch temporaneamente non disponibile.' })
  }
})

export default router
