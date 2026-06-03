// ═══════════════════════════════════════════════════════════════
//  ORVEX BREACH DATABASE — Simulazione dati
//
//  Tutti i breach sono simulati a scopo dimostrativo.
//  La funzione checkEmail() è deterministica: stessa email
//  → stesso risultato (basato su hash FNV-1a a 32 bit).
// ═══════════════════════════════════════════════════════════════

// ── 1. CATALOGO BREACH ─────────────────────────────────────────
export const BREACH_CATALOG = [
  {
    id:          'linkedin-2021',
    name:        'LinkedIn Scraping 2021',
    year:        2021,
    records:     700_000_000,
    severity:    'critical',
    dataTypes:   ['email', 'username', 'phone', 'address'],
    source:      'LinkedIn / RaidForums',
    description: '700 milioni di profili LinkedIn esposti tramite scraping massivo e fusione con il dataset COMB. Include nomi completi, indirizzi email, numeri di telefono e URL di profilo.',
  },
  {
    id:          'rockyou2024',
    name:        'RockYou2024 ComboList',
    year:        2024,
    records:     9_948_575_739,
    severity:    'critical',
    dataTypes:   ['email', 'password', 'username'],
    source:      'BreachForums / Dark Web',
    description: 'Il più grande database di credenziali mai pubblicato. Aggregazione di oltre 4.000 dataset precedenti. Contiene coppie email:password in chiaro e hash MD5/SHA1.',
  },
  {
    id:          'facebook-2019',
    name:        'Facebook Data Leak 2019',
    year:        2019,
    records:     533_000_000,
    severity:    'high',
    dataTypes:   ['phone', 'email', 'username', 'address'],
    source:      'Meta / BreachForums',
    description: 'Dati di 533 milioni di utenti Facebook pubblicati gratuitamente. Numeri di telefono, ID Facebook, nomi completi, date di nascita e in alcuni casi indirizzi email.',
  },
  {
    id:          'adobe-2013',
    name:        'Adobe Systems 2013',
    year:        2013,
    records:     152_445_165,
    severity:    'high',
    dataTypes:   ['email', 'password', 'username', 'credit'],
    source:      'Adobe Inc.',
    description: 'Violazione massiva dei server Adobe. Esposti 152 milioni di account con password cifrate in modo debole (3DES) e dati di carte di credito parzialmente oscurati.',
  },
  {
    id:          'twitter-2022',
    name:        'Twitter API Leak 2022',
    year:        2022,
    records:     235_000_000,
    severity:    'high',
    dataTypes:   ['email', 'username', 'phone'],
    source:      'Twitter / X Corp',
    description: 'Sfruttamento di una vulnerabilità API zero-day. Esposti 235 milioni di profili con associazione email–username precedentemente anonima.',
  },
  {
    id:          'dropbox-2012',
    name:        'Dropbox Breach 2012',
    year:        2012,
    records:     68_648_009,
    severity:    'medium',
    dataTypes:   ['email', 'password'],
    source:      'Dropbox Inc.',
    description: 'Credenziali di 68 milioni di account Dropbox esfiltrate. Hash bcrypt per gli account più recenti, SHA-1 non salato per i precedenti.',
  },
  {
    id:          'lastpass-2022',
    name:        'LastPass Vault 2022',
    year:        2022,
    records:     25_000_000,
    severity:    'critical',
    dataTypes:   ['email', 'password', 'username', 'address'],
    source:      'LastPass / GoTo',
    description: 'Violazione in due fasi del password manager LastPass. Esposti vault cifrati degli utenti e metadati degli account. Considerato uno dei breach più pericolosi per le potenziali conseguenze a cascata.',
  },
  {
    id:          'canva-2019',
    name:        'Canva Design Platform 2019',
    year:        2019,
    records:     139_000_000,
    severity:    'medium',
    dataTypes:   ['email', 'username', 'phone'],
    source:      'Canva Pty Ltd',
    description: 'Attacco SQL injection sulla piattaforma Canva. Esposti username, email, nomi reali, città e password hash bcrypt.',
  },
  {
    id:          'twitch-2021',
    name:        'Twitch Source Leak 2021',
    year:        2021,
    records:     125_000_000,
    severity:    'high',
    dataTypes:   ['email', 'username', 'credit'],
    source:      'Twitch / Amazon',
    description: 'Leak del codice sorgente completo di Twitch e dati di 125 milioni di streamer. Include storico pagamenti, token OAuth e dati di accesso degli account creatori.',
  },
  {
    id:          'collection1-2019',
    name:        'Collection #1 Dataset 2019',
    year:        2019,
    records:     773_000_000,
    severity:    'critical',
    dataTypes:   ['email', 'password'],
    source:      'MEGA / Dark Web Aggregation',
    description: 'Mega-collezione di 773 milioni di indirizzi email unici e 21 milioni di password uniche, aggregata da centinaia di breach precedenti. Prima "collection" di questa scala.',
  },
  {
    id:          'microsoft-2021',
    name:        'Microsoft Exchange ProxyLogon',
    year:        2021,
    records:     60_000,
    severity:    'critical',
    dataTypes:   ['email', 'username', 'address'],
    source:      'Microsoft / HAFNIUM APT',
    description: 'Exploit zero-day su Microsoft Exchange Server (CVE-2021-26855). Attribuito al gruppo APT cinese HAFNIUM. Colpite organizzazioni governative, militari e aziende Fortune 500.',
  },
  {
    id:          'zynga-2019',
    name:        'Zynga Words With Friends 2019',
    year:        2019,
    records:     218_000_000,
    severity:    'medium',
    dataTypes:   ['email', 'username', 'phone', 'password'],
    source:      'Zynga Inc.',
    description: 'Breach di Zynga che ha esposto i dati di giocatori di Words With Friends. Include email, username, ID Facebook/Google, numeri di telefono e hash SHA-1 delle password.',
  },
]

// ── 2. FUNZIONE HASH (FNV-1a 32-bit) ──────────────────────────
// Deterministica, non crittografica — solo per la simulazione.
function fnv1a(str) {
  let hash = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return hash >>> 0  // Unsigned 32-bit
}

// ── 3. FUNZIONE PRINCIPALE: checkEmail() ───────────────────────
/**
 * Controlla se un'email è presente nel database simulato.
 *
 * @param   {string}  email  - Email da verificare (case insensitive)
 * @returns {{ breached: boolean, breaches: Array }}
 *
 * Logica:
 *  - ~65% delle email risultano compromesse (hash % 100 < 65)
 *  - Il numero di breach varia da 1 a 4 in base all'hash
 *  - I breach selezionati sono deterministici (stessa email = stesso risultato)
 */
export function checkEmail(email) {
  const normalized = email.toLowerCase().trim()
  const hash       = fnv1a(normalized)

  // Soglia: email con hash % 100 >= 65 risultano SICURE
  const isSafe = (hash % 100) >= 65

  if (isSafe) {
    return { breached: false, breaches: [] }
  }

  // Numero di breach: 1 → 4 in base all'hash
  const numBreaches = ((hash % 4) + 1)

  // Selezione deterministica dei breach
  const selectedIds = new Set()
  const selected    = []

  for (let i = 0; i < BREACH_CATALOG.length && selected.length < numBreaches; i++) {
    // Indice pseudo-casuale derivato dall'hash + posizione
    const idx = (hash + i * 0x9e3779b9) % BREACH_CATALOG.length
    const breach = BREACH_CATALOG[idx]

    if (!selectedIds.has(breach.id)) {
      selectedIds.add(breach.id)
      selected.push(breach)
    }
  }

  // Ordina per severity (critical prima) poi per anno (più recenti prima)
  const SEVERITY_RANK = { critical: 0, high: 1, medium: 2 }
  selected.sort((a, b) => {
    const sd = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
    return sd !== 0 ? sd : b.year - a.year
  })

  return { breached: true, breaches: selected }
}

// ── 4. FUNZIONE REALE: checkEmailReal() ───────────────────────
/**
 * Chiama il backend Orvex (/api/breach/check) che a sua volta
 * interroga HaveIBeenPwned API v3.
 *
 * @param   {string}  email  - Email da verificare
 * @returns {Promise<{ breached: boolean, breaches: Array, source: 'api'|'mock' }>}
 *
 * Fallback automatico su checkEmail() (dati mock) se:
 *  - Il backend non è raggiungibile (HIBP_API_KEY mancante)
 *  - C'è un errore di rete
 *  - Il server risponde con useMock: true
 */
export async function checkEmailReal(email) {
  try {
    const res = await fetch(
      `/api/breach/check?email=${encodeURIComponent(email)}`,
      { signal: AbortSignal.timeout(8000) }   // timeout 8s
    )

    // Backend raggiungibile ma HIBP key mancante → fallback mock
    if (res.status === 503) {
      console.info('[Orvex] Backend attivo ma HIBP_API_KEY mancante → dati mock')
      return { ...checkEmail(email), source: 'mock' }
    }

    // Rate limit Stripe — riprova dopo un attimo
    if (res.status === 429) {
      console.warn('[Orvex] HIBP rate limit — attendi 1,5s e riprova')
      await new Promise(r => setTimeout(r, 1500))
      return checkEmailReal(email)
    }

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }

    const data = await res.json()

    // Il backend ci dice esplicitamente di usare i mock (errore HIBP)
    if (data.useMock) {
      return { ...checkEmail(email), source: 'mock' }
    }

    return { ...data, source: 'api' }

  } catch (err) {
    // Backend non avviato o network error → fallback silenzioso ai mock
    if (err.name === 'AbortError') {
      console.warn('[Orvex] Timeout chiamata backend → dati mock')
    } else {
      console.warn('[Orvex] Backend non raggiungibile →', err.message, '→ dati mock')
    }
    return { ...checkEmail(email), source: 'mock' }
  }
}

// ── 5. HELPERS ─────────────────────────────────────────────────

/** Conta i breach per livello di severity */
export function countBySeverity(breaches) {
  return breaches.reduce(
    (acc, b) => ({ ...acc, [b.severity]: (acc[b.severity] || 0) + 1 }),
    { critical: 0, high: 0, medium: 0 }
  )
}

/** Calcola il totale di record esposti */
export function totalRecordsExposed(breaches) {
  return breaches.reduce((sum, b) => sum + (b.records || 0), 0)
}

/** Restituisce il livello di rischio complessivo come stringa */
export function overallRiskLevel(breaches) {
  if (!breaches.length)                              return 'SICURO'
  if (breaches.some(b => b.severity === 'critical')) return 'CRITICO'
  if (breaches.some(b => b.severity === 'high'))     return 'ALTO'
  return 'MEDIO'
}

/** Formatta un numero di record in modo leggibile */
export function formatRecords(n) {
  if (!n)       return '?'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(n)
}

// ── 5. DATI MOCK DASHBOARD PREMIUM ────────────────────────────

/** Dipendenti fittizi per la sezione DomainShield */
export const MOCK_EMPLOYEES = [
  { name: 'Marco Bellini',    email: 'm.bellini@corp.it',     status: 'breached',  lastBreach: 'LinkedIn 2021',    breachCount: 3, role: 'CEO'         },
  { name: 'Giulia Ferretti',  email: 'g.ferretti@corp.it',    status: 'safe',      lastBreach: null,               breachCount: 0, role: 'CTO'         },
  { name: 'Andrea Conti',     email: 'a.conti@corp.it',       status: 'breached',  lastBreach: 'RockYou2024',      breachCount: 5, role: 'Dev Lead'     },
  { name: 'Sara Moretti',     email: 's.moretti@corp.it',     status: 'safe',      lastBreach: null,               breachCount: 0, role: 'Designer'     },
  { name: 'Luca Esposito',    email: 'l.esposito@corp.it',    status: 'breached',  lastBreach: 'Facebook 2019',    breachCount: 2, role: 'Sales'        },
  { name: 'Elena Russo',      email: 'e.russo@corp.it',       status: 'breached',  lastBreach: 'Adobe 2013',       breachCount: 1, role: 'Marketing'    },
  { name: 'Davide Romano',    email: 'd.romano@corp.it',      status: 'safe',      lastBreach: null,               breachCount: 0, role: 'HR'           },
  { name: 'Francesca Bruno',  email: 'f.bruno@corp.it',       status: 'breached',  lastBreach: 'LastPass 2022',    breachCount: 4, role: 'Finance'      },
]

/** Dati storici minacce — ultimi 7 giorni (per sparkline ThreatMeter) */
export const THREAT_HISTORY = [
  { day: 'Lun', threats: 4,  critical: 1 },
  { day: 'Mar', threats: 6,  critical: 2 },
  { day: 'Mer', threats: 5,  critical: 1 },
  { day: 'Gio', threats: 9,  critical: 3 },
  { day: 'Ven', threats: 7,  critical: 2 },
  { day: 'Sab', threats: 11, critical: 4 },
  { day: 'Ogg', threats: 7,  critical: 3 },
]

/** Statistiche globali per la dashboard */
export const DASHBOARD_STATS = {
  activeThreat:    7,
  criticalAlerts:  3,
  highAlerts:      4,
  monitoredEmails: 8,
  domainScore:     34,      // Su 100 — più basso = più a rischio
  lastScan:        'oggi alle 14:32',
  nextScan:        'tra 47 minuti',
  darkWebMentions: 12,
}
