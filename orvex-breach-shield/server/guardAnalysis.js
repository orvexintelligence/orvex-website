
import { URL } from 'node:url'

// Riconosce un URL presente nel testo.
export function extractUrl(text) {
  if (typeof text !== 'string') return null

  const trimmed = text.trim()
  const match = trimmed.match(/https?:\/\/[^\s]+/i)

  if (!match) return null

  try {
    const url = new URL(match[0])
    if (!['http:', 'https:'].includes(url.protocol)) {
      return null
    }
    return url.href
  } catch {
    return null
  }
}

// Analisi preliminare degli URL.
// Regole migrate dal vecchio backend AWS.
export function analyzeUrlFeatures(urlString) {
  const signals = []
  let riskScore = 0

  try {
    const parsed = new URL(urlString)
    const hostname = parsed.hostname.toLowerCase()

    const suspiciousTlds = [
      '.xyz', '.tk', '.ml', '.ga', '.cf', '.gq',
      '.top', '.club', '.work', '.click', '.link'
    ]

    if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
      signals.push({
        type: 'warn',
        text: `TLD sospetto: ${hostname.split('.').pop()}`
      })
      riskScore += 25
    }

    const brands = [
      'paypal', 'amazon', 'google', 'microsoft',
      'apple', 'facebook', 'instagram', 'netflix',
      'intesa', 'unicredit', 'poste', 'inps',
      'bancomatpay', 'satispay', 'whatsapp', 'telegram'
    ]

    for (const brand of brands) {
      if (
        hostname.includes(brand) &&
        !hostname.endsWith(brand + '.com') &&
        !hostname.endsWith(brand + '.it')
      ) {
        signals.push({
          type: 'warn',
          text: `Possibile imitazione del brand: ${brand}`
        })
        riskScore += 40
      }
    }

    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      signals.push({
        type: 'warn',
        text: 'URL con indirizzo IP invece di dominio'
      })
      riskScore += 35
    }

    if (urlString.length > 100) {
      signals.push({
        type: 'warn',
        text: 'URL insolitamente lungo'
      })
      riskScore += 15
    }

    const suspiciousWords = [
      'login', 'verify', 'secure', 'account',
      'update', 'confirm', 'password', 'banking',
      'payment', 'signin', 'verifica', 'accedi',
      'sicurezza', 'aggiorna'
    ]

    const pathAndQuery =
      (parsed.pathname + parsed.search).toLowerCase()

    const foundWords = suspiciousWords.filter(
      word => pathAndQuery.includes(word)
    )

    if (foundWords.length > 0) {
      signals.push({
        type: 'warn',
        text: `Parole sospette nell'URL: ${foundWords.join(', ')}`
      })
      riskScore += 20
    }

    if (hostname.split('.').length > 4) {
      signals.push({
        type: 'warn',
        text: 'Troppi sottodomini'
      })
      riskScore += 20
    }

    if (parsed.protocol === 'http:') {
      signals.push({
        type: 'warn',
        text: 'Connessione HTTP non cifrata'
      })
      riskScore += 15
    } else {
      signals.push({
        type: 'ok',
        text: 'Connessione HTTPS'
      })
    }

    if (parsed.search.length > 50) {
      signals.push({
        type: 'warn',
        text: 'Parametri URL insolitamente lunghi'
      })
      riskScore += 10
    }

    if ((hostname.match(/-/g) || []).length >= 3) {
      signals.push({
        type: 'warn',
        text: 'Dominio con molti trattini'
      })
      riskScore += 20
    }

    riskScore = Math.min(riskScore, 98)

    return {
      score: riskScore,
      level: riskScore >= 60
        ? 'danger'
        : riskScore >= 30
          ? 'warning'
          : 'safe',
      signals,
      hostname,
      urlAnalysis: true,
      preliminary: true
    }
  } catch {
    return {
      error: 'URL non valido',
      preliminary: true
    }
  }
}
