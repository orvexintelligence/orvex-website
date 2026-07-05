import { useState } from 'react'
import {
  Activity, Zap, Shield, Star, Lock,
  Globe, Search, ArrowRight, Loader2, FileText, UserPlus,
  ExternalLink, CheckCircle2, RefreshCcw,
} from 'lucide-react'
import clsx from 'clsx'

// Link Stripe Domain Watch
const DOMAIN_STRIPE = {
  monthly: 'https://buy.stripe.com/dRmaEXaZp8qS5pA0P6bEA02',
  annual:  'https://buy.stripe.com/cNi8wP4B1gXo7xI9lCbEA04',
}
import ThreatMeter  from './ThreatMeter'
import DomainShield from './DomainShield'
import ReportButton from './ReportButton'
import { DASHBOARD_STATS } from '@data/breachDatabase'

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'https://orvex-server.onrender.com'
).replace(/\/$/, '')

// ─────────────────────────────────────────────────────────────────
//  DomainDashboard — Dashboard aziendale Domain Watch
//
//  Props:
//    email      → string, email dell'utente (per il report)
//    isPremium  → bool, true = dati completi, false = teaser oscurato
//    onUpgrade  → callback per aprire il flusso acquisto
// ─────────────────────────────────────────────────────────────────

export default function DomainDashboard({ email = '', isPremium = true, onUpgrade }) {
  const [activeTab,    setActiveTab]    = useState('overview')
  const [domainInput,  setDomainInput]  = useState('')
  const [activeDomain, setActiveDomain] = useState(null)
  const [scanResult,    setScanResult]    = useState(null)
  const [scanError,     setScanError]     = useState(null)
  const [analyzing,    setAnalyzing]    = useState(false)
  const [billing,      setBilling]      = useState('monthly')

  // ── Step 1: inserimento dominio ────────────────────────────────
  const handleAnalyze = async (e) => {
    e.preventDefault()
    const raw = domainInput.trim()
    if (!raw) return

    const clean = raw
      .replace(/^https?:\/\//i, '')
      .replace(/^www\./i, '')
      .replace(/\/.*$/, '')
      .toLowerCase()

    setAnalyzing(true)
    setScanError(null)

    try {
      const endpoint = `${API_BASE_URL}/api/domain/scan?domain=${encodeURIComponent(clean)}`
      const response = await fetch(endpoint, { signal: AbortSignal.timeout(18000) })

      let data = null
      try {
        data = await response.json()
      } catch {
        data = null
      }

      if (!response.ok) {
        const error = new Error(data?.error || `HTTP ${response.status}`)
        error.status = response.status
        error.paymentRequired = response.status === 402 || data?.code === 'FREE_LIMIT_REACHED'
        error.paymentUrl = data?.paymentUrl
        throw error
      }

      setScanResult(data)
      setActiveDomain(clean)
    } catch (err) {
      setScanError({
        message: err.paymentRequired
          ? 'Scansione gratuita Domain Watch terminata. Attiva Premium per continuare.'
          : err.message || 'Motore Domain Watch temporaneamente non disponibile.',
        paymentRequired: !!err.paymentRequired,
        paymentUrl: err.paymentUrl,
      })
    } finally {
      setAnalyzing(false)
    }
  }

  // ── Schermata inserimento dominio ──────────────────────────────
  if (!activeDomain) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-10 px-4">

        {/* Icona */}
        <div
          className="w-16 h-16 rounded-xs flex items-center justify-center mb-6"
          style={{
            background: 'rgba(0,102,255,0.08)',
            border: '1px solid rgba(0,102,255,0.25)',
            boxShadow: '0 0 28px rgba(0,102,255,0.15)',
          }}
        >
          <Globe size={28} style={{ color: '#0066ff' }} />
        </div>

        {/* Titolo */}
        <h2
          className="font-mono font-extrabold text-xl sm:text-2xl tracking-wide uppercase mb-2 text-center"
          style={{ color: '#f0f4ff', textShadow: '0 0 24px rgba(0,102,255,0.2)' }}
        >
          <span style={{ color: '#0066ff' }}>Monitoraggio Dominio Aziendale</span>
        </h2>
        <p
          className="font-mono text-xs text-center mb-8 max-w-sm leading-relaxed"
          style={{ color: '#8899bb' }}
        >
          Inserisci il dominio della tua azienda per avviare il monitoraggio.
        </p>

        {/* Form */}
        <form
          onSubmit={handleAnalyze}
          className="w-full max-w-md flex flex-col sm:flex-row gap-3"
        >
          <div
            className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xs"
            style={{
              background: 'rgba(8,12,20,0.9)',
              border: '1px solid rgba(0,102,255,0.25)',
              boxShadow: '0 0 12px rgba(0,102,255,0.08)',
            }}
          >
            <Search size={13} style={{ color: '#445566', flexShrink: 0 }} />
            <input
              type="text"
              value={domainInput}
              onChange={e => setDomainInput(e.target.value)}
              placeholder="es. tuaazienda.com"
              required
              disabled={analyzing}
              className="flex-1 bg-transparent outline-none font-mono text-sm"
              style={{ color: '#f0f4ff' }}
              autoFocus
            />
          </div>

          <button
            type="submit"
            disabled={analyzing || !domainInput.trim()}
            className="flex items-center justify-center gap-2
                       font-mono text-xs font-bold tracking-[0.1em] uppercase
                       px-6 py-3 rounded-xs transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(0,102,255,0.9), rgba(0,60,200,0.9))',
              border: '1px solid rgba(0,102,255,0.4)',
              boxShadow: '0 0 16px rgba(0,102,255,0.25)',
              color: '#fff',
            }}
            onMouseEnter={e => { if (!analyzing) e.currentTarget.style.boxShadow = '0 0 28px rgba(0,102,255,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(0,102,255,0.25)' }}
          >
            {analyzing ? (
              <><Loader2 size={13} className="animate-spin" /> Analisi in corso...</>
            ) : (
              <>Analizza Dominio <ArrowRight size={13} /></>
            )}
          </button>
        </form>

        {scanError && (
          <div
            className="mt-5 w-full max-w-md rounded-xs px-4 py-4"
            style={{
              background: scanError.paymentRequired ? 'rgba(255,102,0,0.08)' : 'rgba(255,34,68,0.08)',
              border: scanError.paymentRequired ? '1px solid rgba(255,170,0,0.35)' : '1px solid rgba(255,34,68,0.25)',
              boxShadow: scanError.paymentRequired ? '0 0 22px rgba(255,170,0,0.12)' : '0 0 22px rgba(255,34,68,0.12)',
            }}
          >
            <p className="font-mono text-xs font-bold uppercase tracking-widest"
              style={{ color: scanError.paymentRequired ? '#ffaa00' : '#ff4466' }}>
              {scanError.paymentRequired ? 'Premium richiesto' : 'Domain Watch non disponibile'}
            </p>
            <p className="font-mono text-[0.68rem] mt-2 leading-relaxed" style={{ color: '#aab8d0' }}>
              {scanError.message}
            </p>
            {scanError.paymentRequired && (
              <a
                href={scanError.paymentUrl || DOMAIN_STRIPE.monthly}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-xs font-mono text-[0.65rem] font-bold uppercase tracking-widest"
                style={{
                  color: '#06111f',
                  background: 'linear-gradient(135deg, #ffaa00, #ffdd66)',
                  boxShadow: '0 0 18px rgba(255,170,0,0.25)',
                }}
              >
                Attiva Domain Watch <ExternalLink size={12} />
              </a>
            )}
          </div>
        )}

        {/* Hint */}
        <p className="font-mono text-[0.6rem] mt-4 text-center" style={{ color: '#2a3550' }}>
          Supporta domini corporate · HIBP + dark web scan · nessun dato memorizzato
        </p>

        {/* Registrazione account */}
        <div
          className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xs w-full max-w-md"
          style={{
            background: 'rgba(124,58,237,0.04)',
            border: '1px solid rgba(124,58,237,0.15)',
          }}
        >
          <UserPlus size={14} style={{ color: '#7c3aed', flexShrink: 0 }} />
          <div className="flex-1">
            <p className="font-mono text-[0.62rem] font-bold" style={{ color: '#f0f4ff' }}>
              Salva i tuoi risultati · Accedi da qualsiasi dispositivo
            </p>
            <p className="font-mono text-[0.58rem]" style={{ color: '#445566' }}>
              Crea un account gratuito per non perdere la cronologia delle scansioni
            </p>
          </div>
          <button
            className="flex-shrink-0 font-mono text-[0.6rem] font-bold tracking-wide uppercase
                       px-3 py-1.5 rounded-xs transition-all duration-150"
            style={{
              color: '#7c3aed',
              background: 'rgba(124,58,237,0.08)',
              border: '1px solid rgba(124,58,237,0.25)',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.16)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)' }}
            onClick={() => alert('Autenticazione Supabase — coming soon!')}
          >
            Registrati
          </button>
        </div>

        {/* Animazione di scansione */}
        {analyzing && (
          <div className="mt-8 w-full max-w-md space-y-2">
            {[
              'Connessione ai database breach...',
              'Scansione dark web in corso...',
              'Calcolo Domain Health Score...',
            ].map((msg, i) => (
              <div
                key={i}
                className="flex items-center gap-2 px-3 py-2 rounded-xs"
                style={{
                  background: 'rgba(0,102,255,0.04)',
                  border: '1px solid rgba(0,102,255,0.1)',
                  animation: `fadeIn 0.4s ease ${i * 0.3}s both`,
                }}
              >
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
                  style={{ background: '#0066ff', boxShadow: '0 0 4px #0066ff' }}
                />
                <span className="font-mono text-[0.62rem]" style={{ color: '#445566' }}>
                  {msg}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Step 2: dashboard (premium = dati completi, free = dati oscurati + CTA) ──
  return (
    <div className="space-y-0">

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div
        className="flex items-center gap-0 border-b overflow-x-auto"
        style={{ borderColor: 'rgba(0,102,255,0.1)' }}
      >
        {[
          { id: 'overview', label: 'Overview',     icon: <Activity size={11} /> },
          { id: 'threats',  label: 'Minacce',      icon: <Zap size={11} />      },
          { id: 'domain',   label: 'Domain',       icon: <Shield size={11} />   },
          { id: 'intel',    label: 'Intelligence', icon: <Star size={11} />, locked: true },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => !tab.locked && setActiveTab(tab.id)}
            className={clsx(
              'flex items-center gap-1.5 px-4 py-2.5 border-b-2 font-mono text-[0.62rem]',
              'tracking-widest uppercase whitespace-nowrap transition-all duration-150',
              tab.locked && 'opacity-40 cursor-not-allowed',
              activeTab === tab.id
                ? 'border-orvex-cyan-500 text-orvex-cyan-500'
                : 'border-transparent text-orvex-text-muted hover:text-orvex-text-secondary',
            )}
            style={{
              borderBottomColor: activeTab === tab.id ? '#0066ff' : 'transparent',
            }}
          >
            {tab.icon}
            {tab.label}
            {tab.locked && <Lock size={8} className="ml-0.5" />}
          </button>
        ))}

        {/* Pulsante reset dominio */}
        <button
          onClick={() => { setActiveDomain(null); setDomainInput('') }}
          className="ml-auto flex items-center gap-1.5 px-3 py-2.5
                     font-mono text-[0.58rem] tracking-widest uppercase
                     transition-colors duration-150 flex-shrink-0"
          style={{ color: '#2a3550' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#0066ff' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#2a3550' }}
        >
          <Globe size={10} />
          {activeDomain}
        </button>
      </div>

      {/* ── Corpo ────────────────────────────────────────────── */}
      <div className="pt-4 space-y-4">

        {/* Barra status */}
        <div
          className="flex flex-wrap items-center gap-3 sm:gap-5 px-4 py-2.5 rounded-xs"
          style={{
            background: 'rgba(8,12,20,0.6)',
            border: '1px solid rgba(0,102,255,0.08)',
          }}
        >
          <StatusChip label="Sistema"           value="ONLINE"                                 color="#00ff88" pulse />
          <StatusChip label="Minacce attive"    value={String(DASHBOARD_STATS.activeThreat)}   color="#ff4444" />
          <StatusChip label="Dark web mentions" value={String(DASHBOARD_STATS.darkWebMentions)} color="#ffaa00" />
          <StatusChip label="Prossimo scan"     value={DASHBOARD_STATS.nextScan}                color="#0066ff" />
          <div className="ml-auto">
            <span className="font-mono text-[0.57rem] tracking-widest" style={{ color: '#445566' }}>
              Domain score:&nbsp;
            </span>
            <span className="font-mono text-[0.57rem] font-bold" style={{ color: '#ff4444' }}>
              {DASHBOARD_STATS.domainScore}/100
            </span>
          </div>
        </div>

        {/* Grid principale */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <ThreatMeter threatLevel={73} />
          </div>
          <div className="lg:col-span-3">
            <DomainShield domain={activeDomain} isPremium={isPremium} onUpgrade={onUpgrade} />
          </div>
        </div>

        {scanResult && (
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            <StatusCard label="Domain Health" value={`${scanResult.healthScore ?? 'n/a'}/100`} tone="#00aaff" />
            <StatusCard label="Threat level" value={scanResult.threatLevel || 'n/a'} tone="#ffaa00" />
            <StatusCard label="Reputation" value={String(scanResult.reputation ?? 'n/a')} tone="#0066ff" />
            <StatusCard label="Registrar" value={scanResult.registrar || 'n/a'} tone="#00ff88" />
          </div>
        )}

        {/* Report Button — completo se premium, CTA upgrade con Stripe se free */}
        {isPremium ? (
          <ReportButton email={email} isPaid={true} onUpgrade={onUpgrade} />
        ) : (
          <div
            className="rounded-xs overflow-hidden"
            style={{
              background: 'rgba(5,8,15,0.95)',
              border: '1px solid rgba(0,102,255,0.2)',
              boxShadow: '0 0 24px rgba(0,102,255,0.08)',
            }}
          >
            {/* Header CTA */}
            <div className="flex items-center gap-3 px-5 py-4 border-b"
              style={{ borderColor: 'rgba(0,102,255,0.1)' }}>
              <Lock size={14} style={{ color: '#0066ff', flexShrink: 0 }} />
              <FileText size={14} style={{ color: '#0066ff', flexShrink: 0 }} />
              <span className="font-mono text-xs font-bold tracking-wide uppercase"
                style={{ color: '#f0f4ff' }}>
                Sblocca Report Completo con Domain Watch Premium
              </span>
            </div>

            {/* Toggle + prezzi + link */}
            <div className="px-5 py-4 space-y-4">
              {/* Toggle mensile/annuale */}
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-[0.65rem] tracking-widest uppercase"
                  style={{ color: billing === 'monthly' ? '#f0f4ff' : '#445566' }}>
                  Mensile
                </span>
                <button
                  onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                  className="relative w-10 h-5 rounded-full transition-all duration-200"
                  style={{
                    background: billing === 'annual' ? 'rgba(0,102,255,0.6)' : 'rgba(68,85,102,0.3)',
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
                  Annuale
                </span>
                {billing === 'annual' && (
                  <span className="font-mono text-[0.55rem] tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
                    style={{ color: '#00ff88', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
                    Risparmia il 15% rispetto al mensile
                  </span>
                )}
              </div>

              {/* Prezzo */}
              <div className="text-center">
                <span className="font-mono font-extrabold text-2xl"
                  style={{ color: '#f0f4ff', textShadow: '0 0 16px rgba(0,102,255,0.3)' }}>
                  {billing === 'annual' ? '129,99€' : '12,99€'}
                </span>
                <span className="font-mono text-sm ml-2" style={{ color: '#8899bb' }}>
                  {billing === 'annual' ? '/anno' : '/mese'}
                </span>
              </div>

              {/* Bottone Stripe */}
              <a
                href={billing === 'annual' ? DOMAIN_STRIPE.annual : DOMAIN_STRIPE.monthly}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2
                           font-mono text-xs font-bold tracking-[0.1em] uppercase
                           text-white py-3.5 rounded-xs transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,102,255,0.9), rgba(0,60,200,0.9))',
                  border: '1px solid rgba(0,102,255,0.4)',
                  boxShadow: '0 0 16px rgba(0,102,255,0.3)',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(0,102,255,0.6)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(0,102,255,0.3)' }}
              >
                <Lock size={13} />
                Attiva Domain Watch Premium
                <ExternalLink size={11} className="opacity-70" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Sub-component: DomainFreeResults ─────────────────────────────
// Vista dedicata per utenti non-premium dopo la scansione del dominio.
// Mostra un riepilogo con dati parziali + pannello abbonamento prominente.
function StatusCard({ label, value, tone }) {
  return (
    <div
      className="rounded-xs px-3 py-3"
      style={{
        background: 'rgba(8,12,20,0.72)',
        border: `1px solid ${tone}33`,
      }}
    >
      <div className="font-mono text-[0.55rem] uppercase tracking-widest" style={{ color: '#445566' }}>
        {label}
      </div>
      <div className="font-mono text-[0.78rem] font-bold mt-1 truncate" style={{ color: tone }}>
        {value}
      </div>
    </div>
  )
}

function DomainFreeResults({ domain, billing, setBilling, onReset, t }) {
  const MOCK_EXPOSED  = 5
  const MOCK_TOTAL    = 8
  const HEALTH_SCORE  = 34

  // Dipendenti mock — solo nomi iniziali visibili, dettagli oscurati
  const TEASER_ROWS = [
    { initials: 'MB', role: 'CEO',      status: 'breached' },
    { initials: 'AC', role: 'Dev Lead', status: 'breached' },
    { initials: 'LE', role: 'Sales',    status: 'breached' },
    { initials: 'ER', role: 'Mktg',     status: 'breached' },
    { initials: 'FB', role: 'Finance',  status: 'breached' },
  ]

  return (
    <div className="space-y-5 py-2">

      {/* ── Intestazione risultati ─────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 rounded-xs"
        style={{ background: 'rgba(255,34,68,0.04)', border: '1px solid rgba(255,34,68,0.15)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#ff4444', boxShadow: '0 0 6px #ff4444' }}
          />
          <span className="font-mono text-[0.65rem] font-bold tracking-widest uppercase"
            style={{ color: '#ff4444' }}>
            Scansione completata
          </span>
          <span className="font-mono text-[0.6rem] px-2 py-0.5 rounded-xs"
            style={{ color: '#00aaff', background: 'rgba(0,170,255,0.08)', border: '1px solid rgba(0,170,255,0.2)' }}>
            @{domain}
          </span>
        </div>
        <button
          onClick={onReset}
          className="font-mono text-[0.58rem] tracking-widest uppercase transition-colors"
          style={{ color: '#2a3550' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#445566' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#2a3550' }}
        >
          ← Nuovo dominio
        </button>
      </div>

      {/* ── Riepilogo statistiche ──────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Health Score', value: String(HEALTH_SCORE), unit: '/100', color: '#ff4444', glow: 'rgba(255,68,68,0.2)' },
          { label: 'Esposti',      value: String(MOCK_EXPOSED),  unit: 'account', color: '#ff6600', glow: 'rgba(255,102,0,0.2)' },
          { label: 'Monitorati',   value: String(MOCK_TOTAL),    unit: 'totali',  color: '#0066ff', glow: 'rgba(0,102,255,0.2)' },
        ].map(({ label, value, unit, color, glow }) => (
          <div key={label}
            className="flex flex-col items-center py-4 rounded-xs"
            style={{ background: `${color}08`, border: `1px solid ${color}20`, boxShadow: `0 0 12px ${glow}` }}
          >
            <span className="font-mono font-extrabold text-2xl tabular-nums"
              style={{ color, textShadow: `0 0 14px ${color}` }}>
              {value}
            </span>
            <span className="font-mono text-[0.5rem] tracking-widest uppercase mt-0.5"
              style={{ color: '#445566' }}>
              {unit}
            </span>
            <span className="font-mono text-[0.55rem] tracking-wide mt-1"
              style={{ color: '#2a3550' }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── Anteprima dipendenti oscurata ─────────────────── */}
      <div
        className="rounded-xs overflow-hidden"
        style={{ background: 'rgba(5,8,15,0.9)', border: '1px solid rgba(0,102,255,0.1)' }}
      >
        <div className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ borderColor: 'rgba(0,102,255,0.08)' }}>
          <span className="font-mono text-[0.62rem] tracking-widest uppercase" style={{ color: '#f0f4ff' }}>
            Account esposti rilevati
          </span>
          <span className="font-mono text-[0.58rem]" style={{ color: '#ff4444' }}>
            {MOCK_EXPOSED} su {MOCK_TOTAL}
          </span>
        </div>
        <div className="relative">
          {TEASER_ROWS.map((row, i) => (
            <div key={i}
              className="flex items-center gap-3 px-4 py-2.5 border-b"
              style={{
                borderColor: 'rgba(0,102,255,0.06)',
                opacity: i < 2 ? 1 : 0.35,
                filter: i >= 2 ? 'blur(2px)' : 'none',
              }}
            >
              <div className="w-7 h-7 rounded-xs flex items-center justify-center flex-shrink-0
                              font-mono text-[0.6rem] font-bold"
                style={{ background: 'rgba(255,68,68,0.1)', border: '1px solid rgba(255,68,68,0.2)', color: '#ff6666' }}>
                {row.initials}
              </div>
              <div className="flex-1">
                <div className="font-mono text-[0.68rem]" style={{ color: '#f0f4ff' }}>
                  {'█'.repeat(8)} {'█'.repeat(6)}
                </div>
                <div className="font-mono text-[0.56rem]" style={{ color: '#2a3550' }}>
                  {'█'.repeat(6)}@{domain}
                </div>
              </div>
              <span className="font-mono text-[0.56rem]" style={{ color: '#2a3550' }}>{row.role}</span>
              <span className="font-mono text-[0.55rem] px-1.5 py-0.5 rounded-xs"
                style={{ color: '#ff4444', background: 'rgba(255,68,68,0.08)', border: '1px solid rgba(255,68,68,0.2)' }}>
                ESPOSTO
              </span>
            </div>
          ))}
          {/* Gradient overlay */}
          <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16"
            style={{ background: 'linear-gradient(to bottom, transparent, rgba(5,8,15,0.97))' }} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════
          PANNELLO ABBONAMENTO — prominente e centrato
      ════════════════════════════════════════════════ */}
      <div
        className="rounded-xs overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, rgba(0,60,140,0.12) 0%, rgba(5,8,15,0.98) 60%)',
          border: '1px solid rgba(0,102,255,0.3)',
          boxShadow: '0 0 40px rgba(0,102,255,0.12)',
        }}
      >
        {/* Accent top */}
        <div className="h-0.5"
          style={{ background: 'linear-gradient(90deg, #0066ff, #00aaff, #0066ff)', boxShadow: '0 0 10px rgba(0,102,255,0.5)' }} />

        <div className="px-6 py-6">
          {/* Titolo */}
          <div className="text-center mb-5">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Shield size={16} style={{ color: '#0066ff' }} />
              <span className="font-mono font-extrabold text-base tracking-wide uppercase"
                style={{ color: '#f0f4ff' }}>
                Sblocca <span style={{ color: '#00aaff' }}>Domain Watch Premium</span>
              </span>
            </div>
            <p className="font-mono text-[0.65rem]" style={{ color: '#8899bb' }}>
              Accedi ai dati completi di {MOCK_EXPOSED} account esposti in @{domain} · Report PDF · Alert in tempo reale
            </p>
          </div>

          {/* Toggle mensile / annuale */}
          <div className="flex items-center justify-center gap-3 mb-5">
            <span className="font-mono text-[0.65rem] tracking-widest uppercase"
              style={{ color: billing === 'monthly' ? '#f0f4ff' : '#445566' }}>
              Mensile
            </span>
            <button
              onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
              className="relative w-11 h-6 rounded-full transition-all duration-200"
              style={{
                background: billing === 'annual' ? 'rgba(0,102,255,0.7)' : 'rgba(68,85,102,0.35)',
                border: '1px solid rgba(0,102,255,0.4)',
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
                style={{
                  background: '#fff',
                  left: billing === 'annual' ? '25px' : '3px',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}
              />
            </button>
            <span className="font-mono text-[0.65rem] tracking-widest uppercase"
              style={{ color: billing === 'annual' ? '#0066ff' : '#445566' }}>
              Annuale
            </span>
            {billing === 'annual' && (
              <span className="font-mono text-[0.55rem] tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
                style={{ color: '#00ff88', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
                Risparmia il 15% rispetto al mensile
              </span>
            )}
          </div>

          {/* Prezzo */}
          <div className="text-center mb-5">
            <span className="font-mono font-extrabold text-4xl tabular-nums"
              style={{ color: '#f0f4ff', textShadow: '0 0 28px rgba(0,102,255,0.4)' }}>
              {billing === 'annual' ? '129,99€' : '12,99€'}
            </span>
            <span className="font-mono text-sm ml-2" style={{ color: '#8899bb' }}>
              {billing === 'annual' ? '/anno' : '/mese'}
            </span>
            {billing === 'annual' && (
              <p className="font-mono text-[0.6rem] mt-1" style={{ color: '#445566' }}>
                Risparmia il 15% rispetto al mensile
              </p>
            )}
          </div>

          {/* Features incluse */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            {[
              'Dati email completi senza oscuramento',
              'Report PDF Intelligence scaricabile',
              'Alert real-time per ogni breach',
              'Domain Health Score aggiornato ogni ora',
              'Integrazione Active Directory',
              'Monitoraggio utenti illimitato',
            ].map((feat, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <CheckCircle2 size={10} style={{ color: '#0066ff', flexShrink: 0, marginTop: '2px' }} />
                <span className="font-mono text-[0.58rem]" style={{ color: '#8899bb' }}>{feat}</span>
              </div>
            ))}
          </div>

          {/* CTA Stripe */}
          <a
            href={billing === 'annual' ? DOMAIN_STRIPE.annual : DOMAIN_STRIPE.monthly}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2
                       font-mono text-sm font-bold tracking-[0.1em] uppercase
                       text-white py-4 rounded-xs transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(0,102,255,0.95), rgba(0,60,200,0.95))',
              border: '1px solid rgba(0,102,255,0.5)',
              boxShadow: '0 0 24px rgba(0,102,255,0.4)',
            }}
            onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 40px rgba(0,102,255,0.65)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(0,102,255,0.4)' }}
          >
            <Shield size={15} />
            Attiva Domain Watch · Accedi ai dati completi
            <ExternalLink size={13} className="opacity-70" />
          </a>

          {/* Garanzie */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4"
            style={{ borderTop: '1px solid rgba(0,102,255,0.08)' }}>
            {[
              { icon: Lock,        text: 'Pagamento sicuro Stripe' },
              { icon: RefreshCcw,  text: 'Disdici in qualsiasi momento' },
              { icon: CheckCircle2, text: 'Attivazione immediata' },
            ].map(({ icon: Icon, text }, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <Icon size={10} style={{ color: '#2a3550' }} />
                <span className="font-mono text-[0.56rem] tracking-wide" style={{ color: '#2a3550' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-component: StatusChip ─────────────────────────────────────
function StatusChip({ label, value, color, pulse = false }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', pulse && 'animate-pulse')}
        style={{ background: color, boxShadow: `0 0 4px ${color}` }}
      />
      <span className="font-mono text-[0.58rem]" style={{ color: '#445566' }}>{label}:</span>
      <span className="font-mono text-[0.58rem] font-bold tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  )
}
