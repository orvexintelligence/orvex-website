import { useState } from 'react'
import {
  Activity, Zap, Shield, Star, Lock,
  Globe, Search, ArrowRight, Loader2, FileText, UserPlus,
  ExternalLink, CheckCircle2, RefreshCcw,
} from 'lucide-react'
import clsx from 'clsx'

const DOMAIN_STRIPE = {
  monthly: 'https://buy.stripe.com/dRmaEXaZp8qS5pA0P6bEA02',
  annual:  'https://buy.stripe.com/cNi8wP4B1gXo7xI9lCbEA04',
}
import ThreatMeter  from './ThreatMeter'
import DomainShield from './DomainShield'
import ReportButton from './ReportButton'
import { DASHBOARD_STATS } from '@data/breachDatabase'

export default function DomainDashboard({ email = '', isPremium = true, onUpgrade }) {
  const [activeTab,    setActiveTab]    = useState('overview')
  const [domainInput,  setDomainInput]  = useState('')
  const [activeDomain, setActiveDomain] = useState(null)
  const [analyzing,    setAnalyzing]    = useState(false)
  const [billing,      setBilling]      = useState('monthly')
  const [vtData,       setVtData]       = useState(null)
  const [vtError,      setVtError]      = useState(null)

  const handleAnalyze = async (e) => {
    e.preventDefault()
    const raw = domainInput.trim()
    if (!raw) return
    setAnalyzing(true)
    setVtData(null)
    setVtError(null)
    const clean = raw.replace(/^https?:\/\//i, '').replace(/\/$/, '').toLowerCase()
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/domain/scan?domain=${encodeURIComponent(clean)}`)
      const json = await res.json()
      setVtData(json)
    } catch (err) {
      console.error('[Domain] VT error:', err)
      setVtError('Errore connessione al server')
      setVtData(null)
    }
    setActiveDomain(clean)
    setAnalyzing(false)
  }

  if (!activeDomain) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] py-10 px-4">
        <div className="w-16 h-16 rounded-xs flex items-center justify-center mb-6"
          style={{ background: 'rgba(0,102,255,0.08)', border: '1px solid rgba(0,102,255,0.25)', boxShadow: '0 0 28px rgba(0,102,255,0.15)' }}>
          <Globe size={28} style={{ color: '#0066ff' }} />
        </div>
        <h2 className="font-mono font-extrabold text-xl sm:text-2xl tracking-wide uppercase mb-2 text-center"
          style={{ color: '#f0f4ff', textShadow: '0 0 24px rgba(0,102,255,0.2)' }}>
          <span style={{ color: '#0066ff' }}>Monitoraggio Dominio Aziendale</span>
        </h2>
        <p className="font-mono text-xs text-center mb-8 max-w-sm leading-relaxed" style={{ color: '#8899bb' }}>
          Inserisci il dominio della tua azienda per avviare il monitoraggio.
        </p>
        <form onSubmit={handleAnalyze} className="w-full max-w-md flex flex-col sm:flex-row gap-3">
          <div className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xs"
            style={{ background: 'rgba(8,12,20,0.9)', border: '1px solid rgba(0,102,255,0.25)', boxShadow: '0 0 12px rgba(0,102,255,0.08)' }}>
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
            className="flex items-center justify-center gap-2 font-mono text-xs font-bold tracking-[0.1em] uppercase px-6 py-3 rounded-xs transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, rgba(0,102,255,0.9), rgba(0,60,200,0.9))', border: '1px solid rgba(0,102,255,0.4)', boxShadow: '0 0 16px rgba(0,102,255,0.25)', color: '#fff' }}
            onMouseEnter={e => { if (!analyzing) e.currentTarget.style.boxShadow = '0 0 28px rgba(0,102,255,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(0,102,255,0.25)' }}
          >
            {analyzing ? (<><Loader2 size={13} className="animate-spin" /> Analisi in corso...</>) : (<>Analizza Dominio <ArrowRight size={13} /></>)}
          </button>
        </form>
        <p className="font-mono text-[0.6rem] mt-4 text-center" style={{ color: '#2a3550' }}>
          Supporta domini corporate · VirusTotal scan · nessun dato memorizzato
        </p>
        <div className="mt-6 flex items-center gap-3 px-4 py-3 rounded-xs w-full max-w-md"
          style={{ background: 'rgba(124,58,237,0.04)', border: '1px solid rgba(124,58,237,0.15)' }}>
          <UserPlus size={14} style={{ color: '#7c3aed', flexShrink: 0 }} />
          <div className="flex-1">
            <p className="font-mono text-[0.62rem] font-bold" style={{ color: '#f0f4ff' }}>Salva i tuoi risultati · Accedi da qualsiasi dispositivo</p>
            <p className="font-mono text-[0.58rem]" style={{ color: '#445566' }}>Crea un account gratuito per non perdere la cronologia delle scansioni</p>
          </div>
          <button
            className="flex-shrink-0 font-mono text-[0.6rem] font-bold tracking-wide uppercase px-3 py-1.5 rounded-xs transition-all duration-150"
            style={{ color: '#7c3aed', background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.25)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.16)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(124,58,237,0.08)' }}
            onClick={() => alert('Autenticazione Supabase — coming soon!')}
          >Registrati</button>
        </div>
        {analyzing && (
          <div className="mt-8 w-full max-w-md space-y-2">
            {['Connessione a VirusTotal...', 'Analisi reputazione dominio...', 'Calcolo Domain Health Score...'].map((msg, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-xs"
                style={{ background: 'rgba(0,102,255,0.04)', border: '1px solid rgba(0,102,255,0.1)', animation: `fadeIn 0.4s ease ${i * 0.3}s both` }}>
                <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: '#0066ff', boxShadow: '0 0 4px #0066ff' }} />
                <span className="font-mono text-[0.62rem]" style={{ color: '#445566' }}>{msg}</span>
              </div>
            ))}
          </div>
        )}
        {vtError && (
          <div className="mt-4 px-4 py-2 rounded-xs w-full max-w-md"
            style={{ background: 'rgba(255,68,68,0.06)', border: '1px solid rgba(255,68,68,0.2)' }}>
            <span className="font-mono text-[0.62rem]" style={{ color: '#ff4444' }}>{vtError}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-0">
      <div className="flex items-center gap-0 border-b overflow-x-auto" style={{ borderColor: 'rgba(0,102,255,0.1)' }}>
        {[
          { id: 'overview', label: 'Overview',     icon: <Activity size={11} /> },
          { id: 'threats',  label: 'Minacce',      icon: <Zap size={11} /> },
          { id: 'domain',   label: 'Domain',       icon: <Shield size={11} /> },
          { id: 'intel',    label: 'Intelligence', icon: <Star size={11} />, locked: true },
        ].map(tab => (
          <button key={tab.id} onClick={() => !tab.locked && setActiveTab(tab.id)}
            className={clsx('flex items-center gap-1.5 px-4 py-2.5 border-b-2 font-mono text-[0.62rem]', 'tracking-widest uppercase whitespace-nowrap transition-all duration-150', tab.locked && 'opacity-40 cursor-not-allowed')}
            style={{ borderBottomColor: activeTab === tab.id ? '#0066ff' : 'transparent', color: activeTab === tab.id ? '#0066ff' : '#445566' }}>
            {tab.icon}{tab.label}{tab.locked && <Lock size={8} className="ml-0.5" />}
          </button>
        ))}
        <button
          onClick={() => { setActiveDomain(null); setDomainInput(''); setVtData(null); setVtError(null) }}
          className="ml-auto flex items-center gap-1.5 px-3 py-2.5 font-mono text-[0.58rem] tracking-widest uppercase transition-colors duration-150 flex-shrink-0"
          style={{ color: '#2a3550' }}
          onMouseEnter={e => { e.currentTarget.style.color = '#0066ff' }}
          onMouseLeave={e => { e.currentTarget.style.color = '#2a3550' }}>
          <Globe size={10} />{activeDomain}
        </button>
      </div>

      <div className="pt-4 space-y-4">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5 px-4 py-2.5 rounded-xs"
          style={{ background: 'rgba(8,12,20,0.6)', border: '1px solid rgba(0,102,255,0.08)' }}>
          <StatusChip label="Sistema"        value="ONLINE"                                                                    color="#00ff88" pulse />
          <StatusChip label="Minacce attive" value={vtData ? String(vtData.malicious)  : String(DASHBOARD_STATS.activeThreat)} color="#ff4444" />
          <StatusChip label="Sospetti"       value={vtData ? String(vtData.suspicious) : '—'}                                  color="#ffaa00" />
          <StatusChip label="Threat Level"   value={vtData ? vtData.threatLevel        : DASHBOARD_STATS.nextScan}             color="#0066ff" />
          <div className="ml-auto">
            <span className="font-mono text-[0.57rem] tracking-widest" style={{ color: '#445566' }}>Domain score:&nbsp;</span>
            <span className="font-mono text-[0.57rem] font-bold"
              style={{ color: vtData ? (vtData.healthScore < 50 ? '#ff4444' : '#00ff88') : '#ff4444' }}>
              {vtData ? `${vtData.healthScore}/100` : `${DASHBOARD_STATS.domainScore}/100`}
            </span>
          </div>
        </div>

        {vtData?.categories?.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {vtData.categories.map((cat, i) => (
              <span key={i} className="font-mono text-[0.58rem] px-2 py-0.5 rounded-xs"
                style={{ color: '#0066ff', background: 'rgba(0,102,255,0.08)', border: '1px solid rgba(0,102,255,0.2)' }}>{cat}</span>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <ThreatMeter threatLevel={vtData ? (100 - vtData.healthScore) : 73} />
          </div>
          <div className="lg:col-span-3">
            <DomainShield domain={activeDomain} isPremium={isPremium} onUpgrade={onUpgrade} />
          </div>
        </div>

        {isPremium ? (
          <ReportButton email={email} isPaid={true} onUpgrade={onUpgrade} />
        ) : (
          <div className="rounded-xs overflow-hidden"
            style={{ background: 'rgba(5,8,15,0.95)', border: '1px solid rgba(0,102,255,0.2)', boxShadow: '0 0 24px rgba(0,102,255,0.08)' }}>
            <div className="flex items-center gap-3 px-5 py-4 border-b" style={{ borderColor: 'rgba(0,102,255,0.1)' }}>
              <Lock size={14} style={{ color: '#0066ff', flexShrink: 0 }} />
              <FileText size={14} style={{ color: '#0066ff', flexShrink: 0 }} />
              <span className="font-mono text-xs font-bold tracking-wide uppercase" style={{ color: '#f0f4ff' }}>
                Sblocca Report Completo con Domain Watch Premium
              </span>
            </div>
            <div className="px-5 py-4 space-y-4">
              <div className="flex items-center justify-center gap-3">
                <span className="font-mono text-[0.65rem] tracking-widest uppercase"
                  style={{ color: billing === 'monthly' ? '#f0f4ff' : '#445566' }}>Mensile</span>
                <button onClick={() => setBilling(b => b === 'monthly' ? 'annual' : 'monthly')}
                  className="relative w-10 h-5 rounded-full transition-all duration-200"
                  style={{ background: billing === 'annual' ? 'rgba(0,102,255,0.6)' : 'rgba(68,85,102,0.3)', border: '1px solid rgba(0,102,255,0.3)' }}>
                  <span className="absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all duration-200"
                    style={{ background: '#fff', left: billing === 'annual' ? '22px' : '2px', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} />
                </button>
                <span className="font-mono text-[0.65rem] tracking-widest uppercase"
                  style={{ color: billing === 'annual' ? '#0066ff' : '#445566' }}>Annuale</span>
                {billing === 'annual' && (
                  <span className="font-mono text-[0.55rem] tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
                    style={{ color: '#00ff88', background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' }}>
                    Risparmia il 15% rispetto al mensile
                  </span>
                )}
              </div>
              <div className="text-center">
                <span className="font-mono font-extrabold text-2xl"
                  style={{ color: '#f0f4ff', textShadow: '0 0 16px rgba(0,102,255,0.3)' }}>
                  {billing === 'annual' ? '129,99€' : '12,99€'}
                </span>
                <span className="font-mono text-sm ml-2" style={{ color: '#8899bb' }}>
                  {billing === 'annual' ? '/anno' : '/mese'}
                </span>
              </div>
              <a href={billing === 'annual' ? DOMAIN_STRIPE.annual : DOMAIN_STRIPE.monthly}
                target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 font-mono text-xs font-bold tracking-[0.1em] uppercase text-white py-3.5 rounded-xs transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, rgba(0,102,255,0.9), rgba(0,60,200,0.9))', border: '1px solid rgba(0,102,255,0.4)', boxShadow: '0 0 16px rgba(0,102,255,0.3)' }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(0,102,255,0.6)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(0,102,255,0.3)' }}>
                <Lock size={13} />Attiva Domain Watch Premium<ExternalLink size={11} className="opacity-70" />
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function StatusChip({ label, value, color, pulse = false }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', pulse && 'animate-pulse')}
        style={{ background: color, boxShadow: `0 0 4px ${color}` }} />
      <span className="font-mono text-[0.58rem]" style={{ color: '#445566' }}>{label}:</span>
      <span className="font-mono text-[0.58rem] font-bold tabular-nums" style={{ color }}>{value}</span>
    </div>
  )
}