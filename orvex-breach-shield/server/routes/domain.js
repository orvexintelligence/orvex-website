import { Router } from 'express'

const router = Router()

router.get('/scan', async (req, res) => {
  const { domain } = req.query
  if (!domain || domain.length < 3) {
    return res.status(400).json({ error: 'Dominio non valido' })
  }
  const apiKey = process.env.VIRUSTOTAL_API_KEY
  if (!apiKey) {
    return res.status(503).json({ error: 'VIRUSTOTAL_API_KEY non configurata' })
  }
  try {
    const cleanDomain = domain.replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase()
    const url = `https://www.virustotal.com/api/v3/domains/${encodeURIComponent(cleanDomain)}`
    const response = await fetch(url, {
      headers: { 'x-apikey': apiKey, 'Accept': 'application/json' },
    })
    if (response.status === 404) {
      return res.json({ domain: cleanDomain, found: false, healthScore: 100, malicious: 0, suspicious: 0, harmless: 0, categories: [], reputation: 0, threatLevel: 'BASSO', lastAnalysis: null })
    }
    if (!response.ok) throw new Error(`VirusTotal API error: ${response.status}`)
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
    return res.json({
      domain: cleanDomain, found: true, healthScore, malicious, suspicious, harmless, undetected,
      reputation: attr.reputation || 0, categories: [...new Set(categories)].slice(0, 5),
      threatLevel, lastAnalysis: attr.last_analysis_date ? new Date(attr.last_analysis_date * 1000).toISOString() : null,
      registrar: attr.registrar || null, country: attr.country || null,
      creationDate: attr.creation_date ? new Date(attr.creation_date * 1000).toISOString() : null,
    })
  } catch (err) {
    console.error('[VT] Fetch error:', err.message)
    return res.status(500).json({ error: 'Errore durante la chiamata a VirusTotal' })
  }
})

export default router