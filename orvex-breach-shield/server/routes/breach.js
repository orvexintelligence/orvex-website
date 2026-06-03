// ─────────────────────────────────────────────────────────────────
//  ORVEX — Route /api/breach
//
//  GET /api/breach/check?email=user@example.com
//    → chiama HaveIBeenPwned API v3
//    → mappa la risposta al formato interno Orvex
//    → restituisce { breached, breaches[], email }
//
//  Documentazione HIBP: https://haveibeenpwned.com/API/v3
// ─────────────────────────────────────────────────────────────────

import { Router } from 'express'

const router = Router()

// ── Mappa DataClasses HIBP → dataTypes Orvex ─────────────────────
const DATA_CLASS_MAP = {
  'passwords':             'password',
  'email addresses':       'email',
  'phone numbers':         'phone',
  'credit cards':          'credit_card',
  'names':                 'name',
  'physical addresses':    'address',
  'usernames':             'username',
  'dates of birth':        'dob',
  'ip addresses':          'ip_address',
  'social media profiles': 'social',
  'geographic locations':  'address',
  'bank account numbers':  'credit_card',
  'financial data':        'credit_card',
}

function mapDataClasses(hibpClasses = []) {
  const mapped = hibpClasses
    .map(c => DATA_CLASS_MAP[c.toLowerCase()] || null)
    .filter(Boolean)
  // Rimuove duplicati
  return [...new Set(mapped)]
}

// ── Calcola severity in base ai dati esposti ──────────────────────
function calcSeverity(dataClasses = []) {
  const lower = dataClasses.map(c => c.toLowerCase())
  if (lower.includes('passwords') || lower.includes('credit cards') || lower.includes('bank account numbers'))
    return 'critical'
  if (lower.includes('phone numbers') || lower.includes('financial data') || lower.includes('ip addresses'))
    return 'high'
  return 'medium'
}

// ── Mappa un breach HIBP al formato interno Orvex ────────────────
function mapBreach(hibp) {
  return {
    name:        hibp.Title || hibp.Name,
    domain:      hibp.Domain || '',
    date:        hibp.BreachDate || '',
    records:     hibp.PwnCount   || 0,
    severity:    calcSeverity(hibp.DataClasses || []),
    dataTypes:   mapDataClasses(hibp.DataClasses || []),
    description: hibp.Description
      // Rimuove i tag HTML dalla descrizione HIBP
      ? hibp.Description.replace(/<[^>]*>/g, '')
      : 'Nessuna descrizione disponibile.',
    verified:    hibp.IsVerified || false,
  }
}

// ── GET /api/breach/check ─────────────────────────────────────────
router.get('/check', async (req, res) => {
  const { email } = req.query

  // Validazione base
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email non valida' })
  }

  const apiKey = process.env.HIBP_API_KEY
  if (!apiKey) {
    console.warn('[HIBP] HIBP_API_KEY mancante — restituisco dati mock')
    return res.status(503).json({
      error:   'HIBP_API_KEY non configurata',
      useMock: true,
    })
  }

  try {
    const url = `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`

    const response = await fetch(url, {
      headers: {
        'hibp-api-key': apiKey,
        'User-Agent':   'Orvex-Breach-Shield/1.0',
      },
    })

    // 404 = email non trovata in nessun breach (notizia positiva!)
    if (response.status === 404) {
      return res.json({ breached: false, breaches: [], email })
    }

    // 429 = rate limit HIBP (max 1 req/1500ms per chiave)
    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after') || '2'
      return res.status(429).json({
        error: `Rate limit HIBP — riprova tra ${retryAfter} secondi`,
      })
    }

    // 401 = chiave API non valida
    if (response.status === 401) {
      return res.status(401).json({ error: 'Chiave HIBP non valida. Verifica HIBP_API_KEY.' })
    }

    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`)
    }

    const hibpBreaches = await response.json()
    const breaches = hibpBreaches.map(mapBreach)

    return res.json({
      breached: breaches.length > 0,
      breaches,
      email,
      count: breaches.length,
    })

  } catch (err) {
    console.error('[HIBP] Fetch error:', err.message)
    return res.status(500).json({
      error:   'Errore durante la chiamata a HaveIBeenPwned',
      useMock: true,
    })
  }
})

export default router
