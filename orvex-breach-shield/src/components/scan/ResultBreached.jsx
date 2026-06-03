import { useState, useEffect } from 'react'
import {
  ShieldX, AlertTriangle, Eye, EyeOff, Lock, RotateCcw, Clock, ExternalLink, Zap,
  Key, Mail, Phone, CreditCard, User, Globe, ChevronRight
} from 'lucide-react'
import clsx from 'clsx'

// ── Helpers (Spostato in alto per evitare problemi di hoisting) ──────────────────
function formatRecords(n) {
  if (!n)       return '?'
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
  if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M'
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K'
  return String(n)
}

// Icone per tipo di dato esposto
const DATA_TYPE_ICONS = {
  email:     { icon: Mail,       color: '#ff6b6b' },
  password:  { icon: Key,        color: '#ff4444' },
  phone:     { icon: Phone,      color: '#ffaa00' },
  credit:    { icon: CreditCard, color: '#ff4444' },
  username:  { icon: User,       color: '#ff8888' },
  address:   { icon: Globe,      color: '#ffbb44' },
}

// Gravità visiva
const SEVERITY = {
  critical: { label: 'CRITICO',  bg: 'rgba(255,20,20,0.12)',   border: '#ff2244', text: '#ff4444' },
  high:     { label: 'ALTO',     bg: 'rgba(255,80,0,0.10)',    border: '#ff6600', text: '#ff8844' },
  medium:   { label: 'MEDIO',    bg: 'rgba(255,160,0,0.09)',   border: '#ffaa00', text: '#ffcc44' },
}

export default function ResultBreached({
  email    = '',
  breaches = [],
  onReset,
  onPremium,
  lang     = 'IT', // Aggiunta prop con default IT per evitare il crash
}) {
  const [step, setStep]             = useState(0)
  const [revealedIdx, setRevealed]  = useState(new Set())
  const [glitchTitle, setGlitch]    = useState(false)
  const [ctaPulse, setCtaPulse]     = useState(false)

  // Animazioni a cascata
  useEffect(() => {
    const delays = [0, 200, 450, 700, 1000, 1400]
    const timers = delays.map((d, i) => setTimeout(() => setStep(i + 1), d))
    return () => timers.forEach(clearTimeout)
  }, [])

  // Glitch periodico sul titolo
  useEffect(() => {
    const id = setInterval(() => {
      setGlitch(true)
      setTimeout(() => setGlitch(false), 350)
    }, 2800)
    return () => clearInterval(id)
  }, [])

  // CTA pulse dopo 1.5 secondi
  useEffect(() => {
    const id = setTimeout(() => setCtaPulse(true), 1500)
    return () => clearTimeout(id)
  }, [])

  const totalRecords = Array.isArray(breaches) ? breaches.reduce((sum, b) => sum + (b.records || 0), 0) : 0
  const hasCritical  = Array.isArray(breaches) ? breaches.some(b => b.severity === 'critical') : false
  const safeBreaches = Array.isArray(breaches) ? breaches : []

  const toggleReveal = (idx) => {
    setRevealed(prev => {
      const next = new Set(prev)
      next.has(idx) ? next.delete(idx) : next.add(idx)
      return next
    })
  }

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* ── Pannello principale ROSSO ─────────────────────────── */}
      <div
        className={clsx(
          'relative rounded-xs overflow-hidden transition-all duration-700',
          step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
        style={{
          background: 'linear-gradient(135deg, rgba(20,4,6,0.98) 0%, rgba(15,3,5,0.99) 100%)',
          border:     '1px solid rgba(255,34,68,0.4)',
          boxShadow:  '0 0 40px rgba(255,34,68,0.10), 0 4px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,34,68,0.12)',
        }}
      >
        {/* Accent line top rosso */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{
            background: 'linear-gradient(90deg, transparent, #ff2244 30%, #ff6666 50%, #ff2244 70%, transparent)',
            boxShadow: '0 0 8px rgba(255,34,68,0.6)',
          }}
        />

        {/* Glow radiale rosso */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(255,34,68,0.06) 0%, transparent 65%)',
          }}
        />

        {/* Pattern griglia sul fondo */}
        <div
          className="absolute inset-0 pointer-events-none opacity-30"
          style={{
            backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(255,34,68,0.03) 23px, rgba(255,34,68,0.03) 24px),
                              repeating-linear-gradient(90deg, transparent, transparent 23px, rgba(255,34,68,0.03) 23px, rgba(255,34,68,0.03) 24px)`,
          }}
        />

        <div className="relative px-5 sm:px-6 pt-7 pb-6">

          {/* ── Header allerta ───────────────────────────────── */}
          <div className="flex flex-col items-center mb-5">

            {/* Ping rings */}
            <div className="relative flex items-center justify-center mb-4">
              <span className="absolute w-20 h-20 rounded-full"
                style={{ border: '1px solid rgba(255,34,68,0.4)', animation: 'breach-ring 2s ease-out infinite' }} />
              <span className="absolute w-28 h-28 rounded-full"
                style={{ border: '1px solid rgba(255,34,68,0.2)', animation: 'breach-ring 2s ease-out 0.6s infinite' }} />
              <span className="absolute w-36 h-36 rounded-full"
                style={{ border: '1px solid rgba(255,34,68,0.08)', animation: 'breach-ring 2s ease-out 1.2s infinite' }} />

              {/* Icona */}
              <div
                className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(255,34,68,0.1)',
                  border: '1px solid rgba(255,34,68,0.5)',
                  boxShadow: '0 0 24px rgba(255,34,68,0.4)',
                  animation: 'icon-pulse 2.5s ease-in-out infinite',
                }}
              >
                <ShieldX size={32}
                  style={{ color: '#ff2244', filter: 'drop-shadow(0 0 10px rgba(255,34,68,0.9))' }} />
              </div>
            </div>

            {/* Alert badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xs mb-3"
              style={{
                background: 'rgba(255,34,68,0.1)',
                border: '1px solid rgba(255,34,68,0.35)',
                boxShadow: '0 0 12px rgba(255,34,68,0.15)',
              }}
            >
              <AlertTriangle size={11} style={{ color: '#ff2244' }} />
              <span className="font-mono text-[0.6rem] tracking-[0.2em] uppercase font-bold"
                style={{ color: '#ff4444' }}>
                ALLERTA SICUREZZA
              </span>
              <AlertTriangle size={11} style={{ color: '#ff2244' }} />
            </div>

            {/* Titolo con glitch */}
            <h2
              className={clsx(
                'font-mono font-bold text-2xl sm:text-3xl tracking-wide text-center mb-1',
                'transition-all duration-500',
                step >= 2 ? 'opacity-100' : 'opacity-0',
                glitchTitle && 'is-glitching',
              )}
              style={{
                color: '#f0f4ff',
                textShadow: '0 0 20px rgba(255,34,68,0.25)',
              }}
            >
              {safeBreaches.length} Breach Rilevat{safeBreaches.length === 1 ? 'o' : 'i'}
            </h2>

            {/* Sottotitolo */}
            <p
              className={clsx(
                'font-mono text-sm text-center transition-all duration-500',
                step >= 2 ? 'opacity-100' : 'opacity-0',
              )}
              style={{ color: '#8899bb' }}
            >
              <span style={{ color: '#ff6666' }}>{email}</span>
              {lang === 'EN' ? ` was found in ${safeBreaches.length} data breach${safeBreaches.length > 1 ? 'es' : ''}.` : ` è stata esposta in ${safeBreaches.length} violazione${safeBreaches.length > 1 ? 'i' : 'e'} di dati.`}
            </p>
          </div>

          {/* ── Riepilogo numerico ──────────────────────────── */}
          <div
            className={clsx(
              'grid grid-cols-3 gap-2 sm:gap-3 mb-5 transition-all duration-500',
              step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
          >
            <StatCard
              label="Breach totali"
              value={safeBreaches.length}
              sub="database compromessi"
              color="#ff4444"
              glow="rgba(255,68,68,0.3)"
            />
            <StatCard
              label="Record esposti"
              value={formatRecords(totalRecords)}
              sub="dati trafugati"
              color="#ff6600"
              glow="rgba(255,102,0,0.3)"
            />
            <StatCard
              label="Rischio stimato"
              value={hasCritical ? 'CRITICO' : 'ALTO'}
              sub="livello di pericolo"
              color={hasCritical ? '#ff2244' : '#ff6600'}
              glow={hasCritical ? 'rgba(255,34,68,0.4)' : 'rgba(255,102,0,0.3)'}
              highlight
            />
          </div>

          {/* Separatore */}
          <div
            className={clsx('h-px mb-4 transition-all duration-500', step >= 3 ? 'opacity-100' : 'opacity-0')}
            style={{ background: 'linear-gradient(90deg, transparent, rgba(255,34,68,0.25), transparent)' }}
          />

          {/* ── Lista breach ─────────────────────────────────── */}
          <div
            className={clsx(
              'space-y-2.5 mb-5 transition-all duration-500',
              step >= 3 ? 'opacity-100' : 'opacity-0'
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[0.6rem] tracking-[0.18em] uppercase"
                style={{ color: '#ff4444' }}>
                // BREACH RILEVATI
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,34,68,0.15)' }} />
            </div>

            {safeBreaches.map((breach, idx) => (
              <BreachCard
                key={idx}
                breach={breach}
                revealed={revealedIdx.has(idx)}
                onToggleReveal={() => toggleReveal(idx)}
                animDelay={idx * 120}
                visible={step >= 3}
              />
            ))}
          </div>

          {/* ── Dato censurato (teaser premium) ─────────────── */}
          <div
            className={clsx(
              'rounded-xs p-4 mb-5 transition-all duration-500',
              step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
            style={{
              background: 'rgba(255,34,68,0.04)',
              border: '1px solid rgba(255,34,68,0.15)',
            }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Lock size={12} style={{ color: '#ff4444' }} />
              <span className="font-mono text-[0.6rem] tracking-[0.18em] uppercase"
                style={{ color: '#ff4444' }}>
                Dati aggiuntivi — Accesso Premium
              </span>
            </div>
            <div className="space-y-1.5">
              {['Password hash ··············', 'Indirizzo IP esposto ·······', 'Token di sessione ··········'].map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: 'rgba(255,100,100,0.4)' }} />
                  <span className="font-mono text-xs text-orvex-text-muted blur-[3px] select-none">
                    {item}
                  </span>
                  <Lock size={9} style={{ color: '#445566', flexShrink: 0 }} />
                </div>
              ))}
            </div>
            <p className="font-mono text-[0.6rem] mt-2 tracking-wide"
              style={{ color: '#ff6666', opacity: 0.7 }}>
              {lang === 'EN' ? 'Unlock full report with Orvex Premium →' : 'Sblocca il report completo con Orvex Premium →'}
            </p>
          </div>

          {/* ── CTA PREMIUM — Il gancio principale ──────────── */}
          <div
            className={clsx(
              'transition-all duration-700',
              step >= 5 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            )}
          >
            {/* Pre-CTA urgency text */}
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,34,68,0.15)' }} />
              <span className="font-mono text-[0.58rem] tracking-widest uppercase"
                style={{ color: '#ff6666', opacity: 0.8 }}>
                I tuoi dati sono a rischio
              </span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,34,68,0.15)' }} />
            </div>

            {/* PULSANTE PRINCIPALE */}
            <button
              onClick={onPremium}
              className={clsx(
                'w-full relative group overflow-hidden',
                'flex items-center justify-center gap-3',
                'font-mono font-bold text-sm tracking-[0.1em] uppercase',
                'text-white py-4 sm:py-5 px-6 rounded-xs',
                'transition-all duration-300',
              )}
              style={{
                background: 'linear-gradient(135deg, #cc0022 0%, #990011 50%, #cc0022 100%)',
                backgroundSize: '200% 100%',
                border: '1px solid rgba(255,80,80,0.5)',
                boxShadow: ctaPulse
                  ? '0 0 30px rgba(255,34,68,0.6), 0 0 60px rgba(255,34,68,0.2), inset 0 1px 0 rgba(255,120,120,0.2)'
                  : '0 0 16px rgba(255,34,68,0.3)',
                animation: ctaPulse ? 'cta-pulse 2s ease-in-out infinite' : 'none',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.backgroundPosition = '100% 0'
                e.currentTarget.style.boxShadow = '0 0 40px rgba(255,34,68,0.8), 0 0 80px rgba(255,34,68,0.3)'
                e.currentTarget.style.transform = 'translateY(-1px)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.backgroundPosition = '0% 0'
                e.currentTarget.style.boxShadow = ctaPulse
                  ? '0 0 30px rgba(255,34,68,0.6), 0 0 60px rgba(255,34,68,0.2)'
                  : '0 0 16px rgba(255,34,68,0.3)'
                e.currentTarget.style.transform = 'translateY(0)'
              }}
            >
              {/* Shimmer sweep */}
              <span
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.07) 50%, transparent 100%)',
                  animation: 'cta-shimmer 2.5s linear infinite',
                }}
              />

              {/* Icona con badge ping */}
              <span className="relative flex-shrink-0">
                <Zap size={18} style={{ filter: 'drop-shadow(0 0 6px rgba(255,200,0,0.8))' }} />
                <span
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
                  style={{ background: '#ffaa00', animation: 'breach-ring 1.5s ease-out infinite' }}
                />
              </span>

              <span className="relative z-10 leading-tight">
                <span className="block text-sm sm:text-base">
                  {lang === 'EN' ? 'Protect your identity with Orvex Premium' : 'Proteggi la tua identità con Orvex Premium'}
                </span>
                <span className="block text-[0.65rem] font-normal tracking-widest opacity-80 mt-0.5">
                  Accedi al report completo e al monitoraggio 24/7
                </span>
              </span>

              <ChevronRight size={18} className="relative z-10 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Feature pills sotto il pulsante */}
            <div
              className={clsx(
                'flex flex-wrap justify-center gap-2 mt-3 transition-all duration-500',
                step >= 6 ? 'opacity-100' : 'opacity-0'
              )}
            >
              {[
                { icon: Eye,          text: 'Monitoraggio continuo' },
                { icon: Lock,         text: 'Alert in tempo reale'  },
                { icon: ExternalLink, text: 'Report PDF intelligence' },
              ].map(({ icon: Icon, text }, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs"
                  style={{
                    background: 'rgba(255,34,68,0.06)',
                    border: '1px solid rgba(255,34,68,0.15)',
                  }}
                >
                  <Icon size={10} style={{ color: '#ff6666', flexShrink: 0 }} />
                  <span className="font-mono text-[0.6rem] tracking-wide"
                    style={{ color: '#ff8888' }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>

            {/* Azione secondaria */}
            <div className="flex justify-center mt-3">
              <button
                onClick={onReset}
                className="flex items-center gap-2 font-mono text-xs tracking-widest uppercase
                           text-orvex-text-muted hover:text-orvex-text-secondary
                           transition-colors duration-200"
              >
                <RotateCcw size={11} />
                Scansiona un'altra email
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── Timestamp footer ──────────────────────────────────── */}
      <div className="flex items-center gap-2 mt-3 px-1">
        <Clock size={10} style={{ color: '#445566' }} />
        <span className="font-mono text-[0.55rem] tracking-widest text-orvex-text-muted">
          Allerta generata · {new Date().toLocaleTimeString('it-IT')} · Conserva questo report
        </span>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes breach-ring {
          0%   { transform: scale(1);   opacity: 0.9; }
          100% { transform: scale(1.8); opacity: 0;   }
        }
        @keyframes icon-pulse {
          0%, 100% { box-shadow: 0 0 24px rgba(255,34,68,0.4); }
          50%       { box-shadow: 0 0 40px rgba(255,34,68,0.8), 0 0 60px rgba(255,34,68,0.2); }
        }
        @keyframes cta-pulse {
          0%, 100% { box-shadow: 0 0 30px rgba(255,34,68,0.5), 0 0 60px rgba(255,34,68,0.15); }
          50%       { box-shadow: 0 0 50px rgba(255,34,68,0.8), 0 0 90px rgba(255,34,68,0.3); }
        }
        @keyframes cta-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  )
}

// ── Sub-component: BreachCard ───────────────────────────────────
function BreachCard({ breach, revealed, onToggleReveal, animDelay, visible }) {
  const sev = SEVERITY[breach.severity] ?? SEVERITY.medium

  return (
    <div
      className={clsx(
        'rounded-xs overflow-hidden transition-all',
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
      style={{
        background: sev.bg,
        border:     `1px solid ${sev.border}40`,
        transitionDelay: `${animDelay}ms`,
        transitionDuration: '400ms',
      }}
    >
      {/* Header card */}
      <div className="flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          {/* Severità dot */}
          <span
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: sev.border, boxShadow: `0 0 6px ${sev.border}` }}
          />

          {/* Nome breach */}
          <span className="font-mono text-xs font-bold truncate"
            style={{ color: '#f0f4ff' }}>
            {breach.name}
          </span>

          {/* Anno badge */}
          <span
            className="flex-shrink-0 font-mono text-[0.58rem] px-1.5 py-0.5 rounded-xs"
            style={{
              color: sev.text,
              background: `${sev.border}15`,
              border: `1px solid ${sev.border}30`,
            }}
          >
            {breach.year}
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          {/* Severità label */}
          <span
            className="hidden sm:block font-mono text-[0.55rem] tracking-widest uppercase"
            style={{ color: sev.text }}
          >
            {sev.label}
          </span>

          {/* Toggle dati esposti */}
          <button
            onClick={onToggleReveal}
            className="p-1 rounded-xs transition-colors"
            style={{ color: '#445566' }}
            title={revealed ? 'Nascondi dettagli' : 'Mostra dettagli'}
          >
            {revealed
              ? <EyeOff size={13} className="hover:text-orvex-text-secondary" />
              : <Eye    size={13} className="hover:text-orvex-text-secondary" />
            }
          </button>
        </div>
      </div>

      {/* Body espandibile */}
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: revealed ? '200px' : '0px' }}
      >
        <div
          className="px-4 pb-3 pt-1 border-t"
          style={{ borderColor: `${sev.border}20` }}
        >
          {/* Info riga */}
          <div className="flex flex-wrap items-center gap-3 mb-2">
            <InfoItem icon={Globe}    label="Fonte"   value={breach.source || breach.name} />
            <InfoItem icon={User}     label="Record"  value={formatRecords(breach.records)} />
          </div>

          {/* Tipi di dati esposti */}
          <div>
            <p className="font-mono text-[0.57rem] tracking-widest uppercase mb-1.5"
              style={{ color: '#445566' }}>
              Dati compromessi:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(breach.dataTypes || ['email', 'password']).map((type, i) => {
                const cfg = DATA_TYPE_ICONS[type] ?? { icon: Key, color: '#8899bb' }
                const Icon = cfg.icon
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 font-mono text-[0.58rem]
                               tracking-wide px-2 py-0.5 rounded-xs"
                    style={{
                      color:      cfg.color,
                      background: `${cfg.color}12`,
                      border:     `1px solid ${cfg.color}25`,
                    }}
                  >
                    <Icon size={9} />
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                )
              })}
            </div>
          </div>

          {/* Descrizione (se presente) */}
          {breach.description && (
            <p className="font-mono text-[0.62rem] mt-2 leading-relaxed"
              style={{ color: '#8899bb' }}>
              {breach.description}
            </p>
          )}
        </div>
      </div>

      {/* Footer record count */}
      <div
        className="px-4 py-1.5 border-t flex items-center justify-between"
        style={{ borderColor: `${sev.border}15`, background: 'rgba(0,0,0,0.2)' }}
      >
        <span className="font-mono text-[0.56rem] tracking-wider"
          style={{ color: '#445566' }}>
          {breach.source || 'Fonte: Database pubblici'}
        </span>
        <span className="font-mono text-[0.56rem] tabular-nums"
          style={{ color: sev.text, opacity: 0.7 }}>
          {formatRecords(breach.records)} record esposti
        </span>
      </div>
    </div>
  )
}

// ── Sub-component: StatCard ─────────────────────────────────────
function StatCard({ label, value, sub, color, glow, highlight = false }) {
  return (
    <div
      className="rounded-xs p-2.5 sm:p-3 text-center"
      style={{
        background: highlight ? `${color}10` : 'rgba(5,8,15,0.8)',
        border: `1px solid ${color}${highlight ? '30' : '15'}`,
        boxShadow: highlight ? `0 0 12px ${glow}` : 'none',
      }}
    >
      <div
        className="font-mono font-bold text-xs sm:text-sm mb-0.5 tabular-nums"
        style={{ color, textShadow: highlight ? `0 0 8px ${glow}` : 'none' }}
      >
        {value}
      </div>
      <div className="font-mono text-[0.56rem] text-orvex-text-secondary leading-tight mb-0.5">
        {label}
      </div>
      <div className="font-mono text-[0.52rem] tracking-wider" style={{ color: '#445566' }}>
        {sub}
      </div>
    </div>
  )
}

// ── Sub-component: InfoItem ─────────────────────────────────────
function InfoItem({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-1">
      <Icon size={10} style={{ color: '#445566' }} />
      <span className="font-mono text-[0.58rem]" style={{ color: '#445566' }}>{label}:</span>
      <span className="font-mono text-[0.58rem]" style={{ color: '#8899bb' }}>{value}</span>
    </div>
  )
}