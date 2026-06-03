// ═══════════════════════════════════════════════════════════════
//  ORVEX — Configurazione Stripe Payment Links
//
//  Come configurare:
//  1. Crea i Payment Links nel tuo Stripe Dashboard
//     (Payments → Payment Links → Create)
//  2. Copia i link nel file .env.local (NON commitare questo file)
//  3. Riavvia il dev server: npm run dev
//
//  Formato link Stripe: https://buy.stripe.com/xxxxxxxxxxxxxxxx
//  Per il redirect post-pagamento, configura il tuo Payment Link
//  con: "After payment → redirect to → https://tuodominio.com?paid=true"
// ═══════════════════════════════════════════════════════════════

// ── Payment Links (letti dalle variabili d'ambiente Vite) ──────
export const STRIPE_LINKS = {
  monthly_eur: import.meta.env.VITE_STRIPE_MONTHLY_EUR || null,
  annual_eur:  import.meta.env.VITE_STRIPE_ANNUAL_EUR  || null,
  monthly_usd: import.meta.env.VITE_STRIPE_MONTHLY_USD || null,
  annual_usd:  import.meta.env.VITE_STRIPE_ANNUAL_USD  || null,
}

// ── Prezzi visualizzati (aggiornare solo qui se cambiano) ──────
export const PRICING = {
  EUR: {
    monthly: {
      amount:     9.99,
      formatted:  '9,99€',
      perMonth:   '9,99€/mese',
      link:       STRIPE_LINKS.monthly_eur,
    },
    annual: {
      amount:      89.99,
      formatted:   '89,99€',
      perMonth:    '7,50€/mese',        // 89.99 / 12 ≈ 7.50
      fullPrice:   '119,88€',           // 9.99 × 12
      saving:      '25%',
      savingAmount: '29,89€',
      link:        STRIPE_LINKS.annual_eur,
    },
  },
  USD: {
    monthly: {
      amount:     9.99,
      formatted:  '$9.99',
      perMonth:   '$9.99/mo',
      link:       STRIPE_LINKS.monthly_usd,
    },
    annual: {
      amount:      89.99,
      formatted:   '$89.99',
      perMonth:    '$7.50/mo',
      fullPrice:   '$119.88',
      saving:      '25%',
      savingAmount: '$29.89',
      link:        STRIPE_LINKS.annual_usd,
    },
  },
}

// ── Helper: controlla se i link Stripe sono configurati ────────
export function isStripeConfigured(currency = 'EUR') {
  const c = PRICING[currency]
  return !!(c?.monthly?.link && c?.annual?.link)
}

// ── Chiave localStorage per persistere il piano attivo ────────
//    Valore: 'identity' | 'domain' | 'api'  (null = non pagato)
export const PLAN_STORAGE_KEY = 'orvex_active_plan'

// ── Backward compat: non usare più questa chiave ───────────────
/** @deprecated usa PLAN_STORAGE_KEY */
export const PAID_STORAGE_KEY = 'orvex_premium_paid'

// ── Parametro URL usato come success_url da Stripe ────────────
// Configura nel Payment Link:
//   After payment → https://app.orvex.io?paid=identity  (o domain, api)
export const STRIPE_SUCCESS_PARAM = 'paid'

// ── Tipi di piano validi ───────────────────────────────────────
export const PLAN_TYPES = ['identity', 'domain', 'api']

// ── Helper: legge il piano attivo dal localStorage ─────────────
export function getActivePlan() {
  const stored = localStorage.getItem(PLAN_STORAGE_KEY)
  return PLAN_TYPES.includes(stored) ? stored : null
}

// ── Helper: salva il piano attivo ─────────────────────────────
export function setActivePlan(planType) {
  if (PLAN_TYPES.includes(planType)) {
    localStorage.setItem(PLAN_STORAGE_KEY, planType)
  }
}

// ── Helper: cancella TUTTO lo storage Orvex (reset completo) ──
//    Usato al mount per eliminare chiavi stale di sessioni precedenti
export function clearLegacyStorage() {
  // Rimuove solo le chiavi del vecchio sistema (isPaid generico)
  // senza toccare PLAN_STORAGE_KEY se ha già un valore valido
  const hasValidPlan = PLAN_TYPES.includes(localStorage.getItem(PLAN_STORAGE_KEY))
  if (!hasValidPlan) {
    localStorage.removeItem(PLAN_STORAGE_KEY)
  }
  // Rimuove sempre le chiavi obsolete
  localStorage.removeItem(PAID_STORAGE_KEY)
  localStorage.removeItem('orvex_plan')
}
