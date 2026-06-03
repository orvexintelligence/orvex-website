import { useState, useEffect, useRef } from 'react'
import {
  X, Shield, Globe, Code2,
  Lock, CreditCard, RefreshCcw,
  CheckCircle2, ArrowRight, ChevronLeft,
  Send, AlertCircle, Activity, ExternalLink,
} from 'lucide-react'
import clsx from 'clsx'
import { setActivePlan } from '@data/stripeConfig'
import { useLanguage } from '@/lib/i18n'

// ─────────────────────────────────────────────────────────────────
//  Link Stripe diretti (Payment Links reali)
// ─────────────────────────────────────────────────────────────────
const STRIPE_LINKS = {
  identity: {
    monthly: 'https://buy.stripe.com/7sY00j2sT22u7xI9lCbEA00',
    annual:  'https://buy.stripe.com/fZu6oH1oP4aC6tE7dubEA01',
  },
  domain: {
    monthly: 'https://buy.stripe.com/dRmaEXaZp8qS5pA0P6bEA02',
    annual:  'https://buy.stripe.com/cNi8wP4B1gXo7xI9lCbEA04',
  },
}

// ── Dati dei piani ────────────────────────────────────────────────
const PLANS = [
  {
    id:          'identity',
    icon:        Shield,
    tag:         'PERSONALE',
    title:       'Identity Shield',
    subtitle:    'Protezione identità digitale',
    accentColor: '#0066ff',
    glowColor:   'rgba(0,102,255,0.18)',
    price:       '9,99€',
    priceSub:    'al mese',
    annualPrice: '89,99€/anno',
    saving:      'Risparmia 25%',
    desc:        'Monitora la tua email in tempo reale. Alert immediato non appena i tuoi dati compaiono in un nuovo data breach o nel dark web.',
    features: [
      'Scansione su 47B+ record',
      'Alert breach in tempo reale',
      'Storico esposizioni completo',
      'Report PDF intelligence mensile',
      'Supporto email prioritario',
    ],
    cta: 'Attiva Identity Shield',
  },
  {
    id:          'domain',
    icon:        Globe,
    tag:         'AZIENDALE',
    title:       'Domain Watch',
    subtitle:    'Protezione completa del dominio',
    accentColor: '#00aaff',
    glowColor:   'rgba(0,170,255,0.15)',
    price:       '12,99€',
    priceSub:    'al mese',
    annualPrice: '129,99€/anno',
    saving:      'Risparmia 25%',
    highlight:   true,
    desc:        'Monitora tutti i dipendenti da un\'unica dashboard. Domain Health Score aggiornato ogni ora, alert per ogni account esposto.',
    features: [
      'Monitoraggio illimitato utenti',
      'Domain Health Score live',
      'Alert per dipendente esposto',
      'Report PDF intelligence settimanale',
      'Integrazione Active Directory',
    ],
    cta: 'Attiva Domain Watch',
  },
  {
    id:          'api',
    icon:        Code2,
    tag:         'ENTERPRISE',
    title:       'API Integration',
    subtitle:    'Integrazione nei tuoi sistemi',
    accentColor: '#7c3aed',
    glowColor:   'rgba(124,58,237,0.15)',
    price:       'Custom',
    priceSub:    'contattaci',
    annualPrice: 'SLA 99.9% incluso',
    saving:      'Volume discount',
    desc:        'Accedi all\'intero motore Orvex via REST API. Integra il breach detection nel tuo SIEM, CI/CD o sistema IAM.',
    features: [
      'REST API 10K req/min',
      'Webhook alert real-time',
      'SDK Python · Node · Go',
      'SLA 99.9% uptime garantito',
      'Support dedicato Enterprise',
    ],
    cta: 'Richiedi accesso API',
  },
]

export default function PricingModal({ planType = 'identity', onClose, onPaymentComplete }) {
  const isDev  = import.meta.env.DEV
  const { t }  = useLanguage()

  // step: 'plans' | 'checkout' | 'enterprise'
  // Se planType === 'api' saltiamo subito al form enterprise
  const [step,       setStep]       = useState(planType === 'api' ? 'enterprise' : 'plans')
  const [billing,    setBilling]    = useState('monthly')  // 'monthly' | 'annual'
  const [visible,    setVisible]    = useState(false)
  const [panelReady, setPanelReady] = useState(false)

  // Enterprise form state
  const [entForm,    setEntForm]    = useState({ name: '', company: '', email: '', useCase: '', volume: '' })
  const [entSending, setEntSending] = useState(false)
  const [entSent,    setEntSent]    = useState(false)
  const [entError,   setEntError]   = useState(false)

  const overlayRef = useRef(null)

  // ── Apertura modale ────────────────────────────────────────────
  useEffect(() => {
    requestAnimationFrame(() => {
      setVisible(true)
      setTimeout(() => setPanelReady(true), 40)
    })
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // ── ESC ────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, []) // eslint-disable-line

  const handleClose = () => {
    setVisible(false)
    setPanelReady(false)
    setTimeout(() => onClose?.(), 300)
  }

  // Identity / Domain → checkout con link Stripe; API → form Enterprise
  const handleActivate = (id) => {
    if (id === 'api') setStep('enterprise')
    else              setStep('checkout')
  }
  const handleBack = () => setStep('plans')

  // Formspree submit per piano Enterprise
  const handleEntSubmit = async (e) => {
    e.preventDefault()
    setEntSending(true)
    setEntError(false)
    try {
      const res = await fetch('https://formspree.io/f/xnjrrqga', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(entForm),
      })
      if (res.ok) setEntSent(true)
      else        setEntError(true)
    } catch {
      setEntError(true)
    } finally {
      setEntSending(false)
    }
  }

  // DEV: simula pagamento senza Stripe
  const handleDevSimulate = () => {
    setActivePlan(planType)
    setVisible(false)
    setTimeout(() => onPaymentComplete?.(planType), 300)
  }

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose() }}
      className={clsx(
        'fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto',
        'transition-all duration-300 px-3 py-6 sm:py-10',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      style={{ background: 'rgba(2,4,10,0.92)', backdropFilter: 'blur(14px)' }}
    >
      <div
        className={clsx(
          'w-full transition-all duration-350',
          panelReady
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-6 scale-[0.97]',
        )}
        style={{ maxWidth: step === 'stripe' ? '980px' : '900px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Top accent ───────────────────────────────────────── */}
        <div
          className="h-0.5 rounded-t-xs"
          style={{
            background: 'linear-gradient(90deg, #0066ff 0%, #00d4ff 35%, #ffaa00 65%, #ff2244 100%)',
            boxShadow: '0 0 16px rgba(0,102,255,0.5)',
          }}
        />

        <div
          className="rounded-b-xs overflow-hidden"
          style={{
            background: 'rgba(6,9,18,0.99)',
            border: '1px solid rgba(0,102,255,0.18)',
            borderTop: 'none',
            boxShadow: '0 32px 100px rgba(0,0,0,0.9)',
          }}
        >

          {/* ── Header ───────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-5 sm:px-7 py-4 border-b"
            style={{ borderColor: 'rgba(0,102,255,0.1)', background: 'rgba(5,8,15,0.7)' }}
          >
            <div className="flex items-center gap-3">
              {(step === 'stripe' || step === 'enterprise') ? (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1.5 font-mono text-[0.65rem]
                             tracking-widest uppercase transition-colors duration-150"
                  style={{ color: '#445566' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#0066ff' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#445566' }}
                >
                  <ChevronLeft size={13} />
                  Torna ai piani
                </button>
              ) : (
                <>
                  <div
                    className="w-8 h-8 rounded-xs flex items-center justify-center flex-shrink-0"
                    style={{
                      background: 'rgba(0,102,255,0.12)',
                      border: '1px solid rgba(0,102,255,0.3)',
                      boxShadow: '0 0 10px rgba(0,102,255,0.2)',
                    }}
                  >
                    <Shield size={15} style={{ color: '#0066ff' }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm tracking-[0.1em] uppercase"
                        style={{ color: '#f0f4ff' }}>
                        {planType
                          ? PLANS.find(p => p.id === planType)?.title || 'Orvex Premium'
                          : 'Orvex Premium'}
                      </span>
                      {!planType && (
                        <span className="font-mono text-[0.55rem] tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
                          style={{
                            color: '#ffaa00',
                            background: 'rgba(255,170,0,0.1)',
                            border: '1px solid rgba(255,170,0,0.25)',
                          }}>
                          3 PIANI
                        </span>
                      )}
                    </div>
                    <p className="font-mono text-[0.58rem]" style={{ color: '#445566' }}>
                      {planType
                        ? PLANS.find(p => p.id === planType)?.subtitle || 'Proteggi la tua identità digitale'
                        : 'Scegli il piano più adatto · Proteggi la tua identità digitale'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-xs
                         text-orvex-text-muted hover:text-orvex-text-primary
                         hover:bg-white/5 transition-all duration-150 flex-shrink-0"
              title="Chiudi"
            >
              <X size={15} />
            </button>
          </div>

          {/* ════════════════════════════════════════════════════════
              STEP 1 — Card grafiche dei piani
          ════════════════════════════════════════════════════════ */}
          {step === 'plans' && (
            <div className="px-5 sm:px-7 py-7">

              {/* Headline */}
              <div className="text-center mb-8">
                <h2
                  className="font-mono font-extrabold text-xl sm:text-2xl tracking-wide uppercase mb-2"
                  style={{ color: '#f0f4ff', textShadow: '0 0 30px rgba(0,102,255,0.2)' }}
                >
                  {t('pricing.title').split(' ').slice(0, -2).join(' ')}{' '}
                  <span style={{ color: '#0066ff' }}>{t('pricing.title').split(' ').slice(-2).join(' ')}</span>
                </h2>
                <p className="font-mono text-xs sm:text-sm" style={{ color: '#8899bb' }}>
                  {t('pricing.subtitle')}
                </p>
              </div>

              {/* Grid card — mostra solo il piano richiesto (se specificato) oppure tutti e 3 */}
              <PlanGrid planType={planType} onActivate={handleActivate} t={t} />

              {/* Security footer */}
              <SecurityFooter t={t} />
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              STEP 2 — Checkout diretto con link Stripe
          ════════════════════════════════════════════════════════ */}
          {step === 'checkout' && (
            <div className="px-5 sm:px-7 py-7" style={{ maxWidth: '520px', margin: '0 auto' }}>

              {/* Piano selezionato */}
              {(() => {
                const plan = PLANS.find(p => p.id === planType) || PLANS[0]
                const Icon = plan.icon
                const links = STRIPE_LINKS[plan.id]
                const isAnnual = billing === 'annual'
                const stripeUrl = isAnnual ? links?.annual : links?.monthly

                const prices = {
                  identity: { monthly: '9,99€', annual: '89,99€' },
                  domain:   { monthly: '12,99€', annual: '129,99€' },
                }
                const price = prices[plan.id]?.[billing] || plan.price

                return (
                  <>
                    {/* Header piano */}
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xs flex items-center justify-center flex-shrink-0"
                        style={{ background: `${plan.accentColor}10`, border: `1px solid ${plan.accentColor}30` }}>
                        <Icon size={18} style={{ color: plan.accentColor }} />
                      </div>
                      <div>
                        <h2 className="font-mono font-bold text-sm tracking-wide uppercase"
                          style={{ color: '#f0f4ff' }}>{plan.title}</h2>
                        <p className="font-mono text-[0.6rem]" style={{ color: '#445566' }}>{plan.subtitle}</p>
                      </div>
                    </div>

                    {/* Toggle mensile / annuale */}
                    <div className="flex items-center justify-center gap-2 mb-6">
                      <span className="font-mono text-[0.65rem] tracking-widest uppercase"
                        style={{ color: billing === 'monthly' ? '#f0f4ff' : '#445566' }}>
                        {t('pricing.monthly')}
                      </span>
                      <button
                        onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                        className="relative w-10 h-5 rounded-full transition-all duration-200"
                        style={{
                          background: billing === 'annual'
                            ? 'rgba(0,102,255,0.6)' : 'rgba(68,85,102,0.3)',
                          border: '1px solid rgba(0,102,255,0.3)',
                        }}
                      >
                        <span
                          className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200"
                          style={{
                            background: '#fff',
                            left: billing === 'annual' ? '22px' : '2px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
                          }}
                        />
                      </button>
                      <span className="font-mono text-[0.65rem] tracking-widest uppercase"
                        style={{ color: billing === 'annual' ? '#0066ff' : '#445566' }}>
                        {t('pricing.annual')}
                      </span>
                      {billing === 'annual' && (
                        <span className="font-mono text-[0.55rem] tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
                          style={{ color: '#00ff88', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
                          {planType === 'domain' ? 'Risparmia il 15% rispetto al mensile' : t('pricing.saveLabel')}
                        </span>
                      )}
                    </div>

                    {/* Prezzo */}
                    <div className="text-center mb-6">
                      <span className="font-mono font-extrabold text-3xl tabular-nums"
                        style={{ color: '#f0f4ff', textShadow: `0 0 20px ${plan.accentColor}40` }}>
                        {price}
                      </span>
                      <span className="font-mono text-sm ml-2" style={{ color: '#8899bb' }}>
                        {isAnnual ? t('pricing.perYear') : t('pricing.perMonth')}
                      </span>
                    </div>

                    {/* Features riepilogo */}
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 size={11} style={{ color: plan.accentColor, flexShrink: 0 }} />
                          <span className="font-mono text-[0.63rem]" style={{ color: '#8899bb' }}>{feat}</span>
                        </li>
                      ))}
                    </ul>

                    {/* Bottone Stripe — apre in nuova tab */}
                    <a
                      href={stripeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2
                                 font-mono text-xs font-bold tracking-[0.1em] uppercase
                                 text-white py-3.5 rounded-xs transition-all duration-200 mb-3"
                      style={{
                        background: `linear-gradient(135deg, ${plan.accentColor}dd, ${plan.accentColor}99)`,
                        border: `1px solid ${plan.accentColor}50`,
                        boxShadow: `0 0 16px ${plan.accentColor}30`,
                      }}
                      onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 0 28px ${plan.accentColor}60` }}
                      onMouseLeave={e => { e.currentTarget.style.boxShadow = `0 0 16px ${plan.accentColor}30` }}
                    >
                      <CreditCard size={13} />
                      {t('pricing.proceedBtn')}
                      <ExternalLink size={11} className="opacity-70" />
                    </a>

                  </>
                )
              })()}

              <SecurityFooter t={t} />
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              STEP 2b — Form contatto Enterprise (piano API)
          ════════════════════════════════════════════════════════ */}
          {step === 'enterprise' && (
            <div className="px-5 sm:px-7 py-7" style={{ maxWidth: '560px', margin: '0 auto' }}>

              {/* Intestazione */}
              <div className="text-center mb-7">
                <div
                  className="w-12 h-12 rounded-xs flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: 'rgba(124,58,237,0.1)',
                    border: '1px solid rgba(124,58,237,0.3)',
                    boxShadow: '0 0 16px rgba(124,58,237,0.2)',
                  }}
                >
                  <Code2 size={20} style={{ color: '#7c3aed' }} />
                </div>
                <h2
                  className="font-mono font-extrabold text-lg tracking-wide uppercase mb-1"
                  style={{ color: '#f0f4ff' }}
                >
                  Richiedi accesso <span style={{ color: '#7c3aed' }}>API Enterprise</span>
                </h2>
                <p className="font-mono text-xs" style={{ color: '#8899bb' }}>
                  Un ingegnere Orvex ti contatterà entro 24h per configurare il tuo piano custom.
                </p>
              </div>

              {entSent ? (
                /* ── Conferma invio ── */
                <div
                  className="rounded-xs p-6 text-center"
                  style={{
                    background: 'rgba(124,58,237,0.05)',
                    border: '1px solid rgba(124,58,237,0.2)',
                  }}
                >
                  <CheckCircle2 size={32} className="mx-auto mb-3" style={{ color: '#7c3aed' }} />
                  <p className="font-mono text-sm font-bold mb-1" style={{ color: '#7c3aed' }}>
                    Richiesta Enterprise inviata!
                  </p>
                  <p className="font-mono text-xs" style={{ color: '#8899bb' }}>
                    Il team Orvex ti contatterà entro 24h
                    {entForm.email && <> all'indirizzo <span style={{ color: '#f0f4ff' }}>{entForm.email}</span></>}.
                  </p>
                </div>
              ) : (
                /* ── Form ── */
                <form onSubmit={handleEntSubmit} className="space-y-4">

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <EntField label="Nome e cognome"    placeholder="Mario Rossi"
                      value={entForm.name}    onChange={v => setEntForm(p => ({ ...p, name: v }))}    required />
                    <EntField label="Azienda"           placeholder="Acme Corp S.p.A."
                      value={entForm.company} onChange={v => setEntForm(p => ({ ...p, company: v }))} required />
                    <EntField label="Email di contatto" placeholder="mario@azienda.it" type="email"
                      value={entForm.email}   onChange={v => setEntForm(p => ({ ...p, email: v }))}   required />

                    {/* Volume select */}
                    <div>
                      <label className="font-mono text-[0.6rem] tracking-widest uppercase block mb-1.5"
                        style={{ color: '#445566' }}>
                        Volume richieste stimato
                      </label>
                      <select
                        value={entForm.volume}
                        onChange={e => setEntForm(p => ({ ...p, volume: e.target.value }))}
                        required
                        className="w-full font-mono text-xs rounded-xs px-3 py-2.5 appearance-none"
                        style={{
                          background: 'rgba(8,12,20,0.8)',
                          border: '1px solid rgba(124,58,237,0.2)',
                          color: entForm.volume ? '#f0f4ff' : '#445566',
                          outline: 'none',
                        }}
                      >
                        <option value="">Seleziona...</option>
                        <option value="10k-100k">10K – 100K req/giorno</option>
                        <option value="100k-1m">100K – 1M req/giorno</option>
                        <option value="1m-10m">1M – 10M req/giorno</option>
                        <option value="10m+">Oltre 10M req/giorno</option>
                      </select>
                    </div>
                  </div>

                  {/* Textarea caso d'uso */}
                  <div>
                    <label className="font-mono text-[0.6rem] tracking-widest uppercase block mb-1.5"
                      style={{ color: '#445566' }}>
                      Caso d'uso / Integrazione richiesta
                    </label>
                    <textarea
                      value={entForm.useCase}
                      onChange={e => setEntForm(p => ({ ...p, useCase: e.target.value }))}
                      required
                      rows={3}
                      placeholder="Es: integrazione nel SIEM aziendale per correlazione breach in tempo reale su 50K utenti..."
                      className="w-full font-mono text-xs rounded-xs px-3 py-2.5 resize-none"
                      style={{
                        background: 'rgba(8,12,20,0.8)',
                        border: '1px solid rgba(124,58,237,0.2)',
                        color: '#f0f4ff',
                        outline: 'none',
                      }}
                    />
                  </div>

                  {/* Errore */}
                  {entError && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xs"
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
                      <AlertCircle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
                      <p className="font-mono text-[0.62rem]" style={{ color: '#ef4444' }}>
                        Errore durante l'invio. Controlla la connessione e riprova.
                      </p>
                    </div>
                  )}

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={entSending}
                    className="w-full flex items-center justify-center gap-2
                               font-mono text-xs font-bold tracking-[0.1em] uppercase
                               text-white py-3.5 rounded-xs transition-all duration-200
                               disabled:opacity-60 disabled:cursor-not-allowed"
                    style={{
                      background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(90,30,200,0.9))',
                      border: '1px solid rgba(124,58,237,0.4)',
                      boxShadow: '0 0 16px rgba(124,58,237,0.25)',
                    }}
                    onMouseEnter={e => { if (!entSending) e.currentTarget.style.boxShadow = '0 0 28px rgba(124,58,237,0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(124,58,237,0.25)' }}
                  >
                    {entSending ? (
                      <><Activity size={13} className="animate-pulse" /> Invio in corso...</>
                    ) : (
                      <><Send size={13} /> Invia richiesta Enterprise <ArrowRight size={12} /></>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-6">
                <SecurityFooter />
              </div>
            </div>
          )}

          {/* ════════════════════════════════════════════════════════
              STEP 2 — Stripe Pricing Table
          ════════════════════════════════════════════════════════ */}
          {step === 'stripe' && (
            <div className="px-4 sm:px-6 pt-5 pb-2">

              {/* Nota DEV redirect */}
              {isDev && (
                <div
                  className="mb-4 px-4 py-3 rounded-xs"
                  style={{
                    background: 'rgba(0,102,255,0.05)',
                    border: '1px solid rgba(0,102,255,0.15)',
                  }}
                >
                  <p className="font-mono text-[0.6rem] leading-relaxed" style={{ color: '#445577' }}>
                    <span style={{ color: '#0066ff' }}>// DEV</span>
                    {' '}Imposta il <strong style={{ color: '#8899bb' }}>Success URL</strong> della
                    Pricing Table su Stripe Dashboard →{' '}
                    <code style={{ color: '#00aaff' }}>http://localhost:5173/?paid=identity</code>
                    {' '}(o <code style={{ color: '#00aaff' }}>domain</code> /{' '}
                    <code style={{ color: '#00aaff' }}>api</code>) per attivare la dashboard dopo il pagamento.
                  </p>
                </div>
              )}

              {/* Container Stripe Pricing Table */}
              <div ref={tableContainer} style={{ minHeight: '420px' }} />

              {/* DEV: simula pagamento */}
              {isDev && (
                <div
                  className="mx-0 mt-3 mb-5 p-3 rounded-xs"
                  style={{
                    background: 'rgba(0,255,0,0.03)',
                    border: '1px solid rgba(0,255,0,0.08)',
                  }}
                >
                  <button
                    onClick={handleDevSimulate}
                    className="w-full flex items-center justify-center gap-2
                               font-mono text-[0.65rem] font-bold tracking-widest uppercase
                               py-2.5 rounded-xs transition-all duration-200"
                    style={{
                      color: '#00cc66',
                      background: 'rgba(0,200,100,0.07)',
                      border: '1px solid rgba(0,200,100,0.2)',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,200,100,0.13)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,200,100,0.07)' }}
                  >
                    <RefreshCcw size={11} />
                    [DEV] Simula pagamento · Attiva dashboard {planType}
                  </button>
                  <p className="font-mono text-[0.53rem] text-center mt-1"
                    style={{ color: '#1a3020' }}>
                    Visibile solo in modalità sviluppo
                  </p>
                </div>
              )}

              {/* Security footer */}
              <SecurityFooter />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}

// ── Sub-component: PlanGrid ─────────────────────────────────────
function PlanGrid({ planType, onActivate, t = (k) => k }) {
  const displayPlans = planType ? PLANS.filter(p => p.id === planType) : PLANS
  const isSingle = displayPlans.length === 1
  return (
    <div className={`grid grid-cols-1 gap-5 mb-7 ${isSingle ? 'max-w-sm mx-auto' : 'md:grid-cols-3'}`}>
      {displayPlans.map((plan) => (
        <PlanCard
          key={plan.id}
          plan={plan}
          isPreselected={isSingle}
          onActivate={onActivate}
          t={t}
        />
      ))}
    </div>
  )
}

// ── Sub-component: PlanCard ─────────────────────────────────────
function PlanCard({ plan, isPreselected, onActivate }) {
  const Icon = plan.icon

  return (
    <div
      className={clsx(
        'relative rounded-xs overflow-hidden flex flex-col transition-all duration-300 group',
        plan.highlight && 'md:-translate-y-2',
      )}
      style={{
        background: 'linear-gradient(160deg, rgba(8,12,22,0.98) 0%, rgba(5,8,15,0.99) 100%)',
        border: `1px solid ${isPreselected ? plan.accentColor + '60' : plan.accentColor + '28'}`,
        boxShadow: isPreselected
          ? `0 4px 28px rgba(0,0,0,0.7), 0 0 22px ${plan.accentColor}22`
          : '0 4px 20px rgba(0,0,0,0.6)',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 8px 40px rgba(0,0,0,0.75), 0 0 30px ${plan.glowColor}`
        if (!plan.highlight) e.currentTarget.style.transform = 'translateY(-3px)'
        else e.currentTarget.style.transform = 'translateY(-5px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = isPreselected
          ? `0 4px 28px rgba(0,0,0,0.7), 0 0 22px ${plan.accentColor}22`
          : '0 4px 20px rgba(0,0,0,0.6)'
        e.currentTarget.style.transform = plan.highlight ? 'translateY(-8px)' : 'translateY(0)'
      }}
    >
      {/* Accent top line */}
      <div
        className="h-0.5 w-full"
        style={{
          background: `linear-gradient(90deg, transparent, ${plan.accentColor}, transparent)`,
          boxShadow: `0 0 8px ${plan.accentColor}60`,
        }}
      />

      {/* Badges top-right */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
        {plan.highlight && (
          <span
            className="font-mono text-[0.55rem] tracking-widest uppercase px-2 py-0.5 rounded-xs"
            style={{
              color: plan.accentColor,
              background: `${plan.accentColor}15`,
              border: `1px solid ${plan.accentColor}40`,
              boxShadow: `0 0 8px ${plan.accentColor}30`,
            }}
          >
            ★ Più scelto
          </span>
        )}
        {isPreselected && (
          <span
            className="font-mono text-[0.53rem] tracking-widest uppercase px-2 py-0.5 rounded-xs"
            style={{
              color: '#00ff88',
              background: 'rgba(0,255,136,0.08)',
              border: '1px solid rgba(0,255,136,0.25)',
            }}
          >
            ✓ Selezionato
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">

        {/* Icona + tag + titolo */}
        <div className="flex items-start gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-xs flex items-center justify-center flex-shrink-0"
            style={{
              background: `${plan.accentColor}10`,
              border: `1px solid ${plan.accentColor}30`,
              boxShadow: `0 0 12px ${plan.accentColor}20`,
            }}
          >
            <Icon size={18} style={{ color: plan.accentColor }} />
          </div>
          <div>
            <span
              className="font-mono text-[0.55rem] tracking-[0.22em] uppercase block"
              style={{ color: plan.accentColor, opacity: 0.85 }}
            >
              {plan.tag}
            </span>
            <h3
              className="font-mono font-bold text-sm tracking-wide"
              style={{ color: '#f0f4ff' }}
            >
              {plan.title}
            </h3>
            <p className="font-mono text-[0.6rem]" style={{ color: '#445566' }}>
              {plan.subtitle}
            </p>
          </div>
        </div>

        {/* Prezzo */}
        <div className="mb-1">
          <span
            className="font-mono font-extrabold text-2xl tabular-nums"
            style={{ color: '#f0f4ff', textShadow: `0 0 18px ${plan.accentColor}30` }}
          >
            {plan.price}
          </span>
          <span className="font-mono text-xs ml-1.5" style={{ color: '#8899bb' }}>
            {plan.priceSub}
          </span>
        </div>
        <p className="font-mono text-[0.58rem] mb-1" style={{ color: plan.accentColor, opacity: 0.8 }}>
          {plan.annualPrice} · {plan.saving}
        </p>

        {/* Separatore */}
        <div
          className="h-px my-3"
          style={{ background: `linear-gradient(90deg, ${plan.accentColor}20, transparent)` }}
        />

        {/* Descrizione */}
        <p className="font-mono text-[0.65rem] leading-relaxed mb-4" style={{ color: '#8899bb' }}>
          {plan.desc}
        </p>

        {/* Features */}
        <ul className="space-y-2 mb-5 flex-1">
          {plan.features.map((feat, i) => (
            <li key={i} className="flex items-start gap-2">
              <CheckCircle2 size={11} style={{ color: plan.accentColor, flexShrink: 0, marginTop: '1px' }} />
              <span className="font-mono text-[0.63rem]" style={{ color: '#8899bb' }}>
                {feat}
              </span>
            </li>
          ))}
        </ul>

        {/* CTA */}
        <button
          onClick={() => onActivate(plan.id)}
          className="w-full flex items-center justify-center gap-2
                     font-mono text-xs font-bold tracking-[0.1em] uppercase
                     text-white py-3 rounded-xs transition-all duration-200 mt-auto"
          style={{
            background: `linear-gradient(135deg, ${plan.accentColor}cc, ${plan.accentColor}88)`,
            border: `1px solid ${plan.accentColor}50`,
            boxShadow: `0 0 12px ${plan.accentColor}25`,
          }}
          onMouseEnter={e => {
            e.currentTarget.style.boxShadow = `0 0 24px ${plan.accentColor}55`
            e.currentTarget.style.transform = 'translateY(-1px)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.boxShadow = `0 0 12px ${plan.accentColor}25`
            e.currentTarget.style.transform = 'translateY(0)'
          }}
        >
          {plan.cta}
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ── Sub-component: EntField ─────────────────────────────────────
function EntField({ label, placeholder, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="font-mono text-[0.6rem] tracking-widest uppercase block mb-1.5"
        style={{ color: '#445566' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full font-mono text-xs rounded-xs px-3 py-2.5"
        style={{
          background: 'rgba(8,12,20,0.8)',
          border: '1px solid rgba(124,58,237,0.2)',
          color: '#f0f4ff',
          outline: 'none',
        }}
      />
    </div>
  )
}

// ── Sub-component: SecurityFooter ───────────────────────────────
function SecurityFooter({ t = (k) => k }) {
  return (
    <div
      className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 pt-4"
      style={{ borderTop: '1px solid rgba(0,102,255,0.08)' }}
    >
      {[
        { icon: Lock,       text: t('pricing.securePayment') },
        { icon: Shield,     text: t('pricing.ssl')           },
        { icon: RefreshCcw, text: t('pricing.cancel')        },
        { icon: CreditCard, text: t('pricing.noHidden')      },
      ].map(({ icon: Icon, text }, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Icon size={10} style={{ color: '#445566', flexShrink: 0 }} />
          <span
            className="font-mono text-[0.57rem] tracking-wide whitespace-nowrap"
            style={{ color: '#445566' }}
          >
            {text}
          </span>
        </div>
      ))}
    </div>
  )
}

