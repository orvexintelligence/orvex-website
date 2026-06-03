import { useState, useEffect } from 'react'
import { ShieldCheck, CheckCircle2, Eye, Database, Clock, RotateCcw, Star } from 'lucide-react'
import clsx from 'clsx'

// Database simulati controllati
const DATABASES_CHECKED = [
  { name: 'HaveIBeenPwned DB',   records: '14.2B' },
  { name: 'ComboList Repository', records: '8.7B'  },
  { name: 'LinkedIn Leak Index',  records: '700M'  },
  { name: 'RockYou2024 Index',    records: '9.9B'  },
  { name: 'DarkWeb Markets DB',   records: '2.1B'  },
  { name: 'Stealer Logs Archive', records: '1.4B'  },
]

export default function ResultSafe({
  email = '',
  onReset,
  onPremium,
  scanStats = {},
}) {
  const [step, setStep]           = useState(0)   // Controlla le animazioni a cascata
  const [counterVal, setCounter]  = useState(0)   // Contatore record scansionati
  
  // SOLUZIONE: Genera lo Scan ID una sola volta all'inizializzazione dello stato
  const [scanId] = useState(() => 'SCN-' + Math.random().toString(36).slice(2, 8).toUpperCase())

  // Animazioni a cascata: icona → titolo → stats → CTA
  useEffect(() => {
    const delays = [0, 300, 600, 950]
    const timers = delays.map((d, i) => setTimeout(() => setStep(i + 1), d))
    return () => timers.forEach(clearTimeout)
  }, [])

  // Contatore animato dei record scansionati
  useEffect(() => {
    if (step < 2) return
    const target = 47200000000  // 47.2 miliardi
    const duration = 1400
    const startTime = performance.now()
    let raf

    const tick = (now) => {
      const elapsed = now - startTime
      const pct = Math.min(elapsed / duration, 1)
      // Easing out cubic
      const eased = 1 - Math.pow(1 - pct, 3)
      setCounter(Math.floor(target * eased))
      if (pct < 1) raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [step])

  const formatCounter = (n) => {
    if (n >= 1e9) return (n / 1e9).toFixed(1) + 'B'
    if (n >= 1e6) return (n / 1e6).toFixed(0) + 'M'
    return n.toLocaleString()
  }

  const scanDate = new Date().toLocaleDateString('it-IT', {
    day: '2-digit', month: 'long', year: 'numeric',
  })

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* ── Pannello principale VERDE ─────────────────────────── */}
      <div
        className={clsx(
          'relative rounded overflow-hidden transition-all duration-700', // Sostituito rounded-xs con rounded
          step >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
        )}
        style={{
          background:  'linear-gradient(135deg, rgba(0,20,12,0.97) 0%, rgba(0,15,9,0.99) 100%)',
          border:      '1px solid rgba(0,255,136,0.35)',
          boxShadow:   '0 0 30px rgba(0,255,136,0.08), 0 4px 32px rgba(0,0,0,0.7), inset 0 1px 0 rgba(0,255,136,0.1)',
        }}
      >
        {/* Accent line top */}
        <div
          className="absolute top-0 left-0 right-0 h-0.5"
          style={{ background: 'linear-gradient(90deg, transparent, #00ff88, transparent)' }}
        />

        {/* Glow radiale centrale */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(0,255,136,0.05) 0%, transparent 70%)',
          }}
        />

        <div className="relative px-6 pt-8 pb-6">

          {/* ── Icona scudo + cerchio pulsante ──────────────── */}
          <div className="flex flex-col items-center mb-6">
            {/* Cerchi ping */}
            <div className="relative flex items-center justify-center mb-4">
              <span
                className="absolute w-20 h-20 rounded-full"
                style={{
                  border: '1px solid rgba(0,255,136,0.3)',
                  animation: 'safe-ring-1 2.5s ease-out infinite',
                }}
              />
              <span
                className="absolute w-28 h-28 rounded-full"
                style={{
                  border: '1px solid rgba(0,255,136,0.15)',
                  animation: 'safe-ring-1 2.5s ease-out 0.5s infinite',
                }}
              />

              {/* Icona centrale */}
              <div
                className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'rgba(0,255,136,0.08)',
                  border: '1px solid rgba(0,255,136,0.4)',
                  boxShadow: '0 0 20px rgba(0,255,136,0.3)',
                }}
              >
                <ShieldCheck
                  size={32}
                  style={{ color: '#00ff88', filter: 'drop-shadow(0 0 8px rgba(0,255,136,0.8))' }}
                />
              </div>
            </div>

            {/* Status badge */}
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded mb-3"
              style={{
                background: 'rgba(0,255,136,0.07)',
                border: '1px solid rgba(0,255,136,0.25)',
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              <span
                className="font-mono text-[0.6rem] tracking-[0.2em] uppercase font-bold"
                style={{ color: '#00ff88' }}
              >
                IDENTITÀ SICURA
              </span>
            </div>

            {/* Titolo */}
            <h2
              className={clsx(
                'font-mono font-bold text-2xl sm:text-3xl tracking-wide text-center mb-1',
                'transition-all duration-500',
                step >= 2 ? 'opacity-100' : 'opacity-0'
              )}
              style={{
                color: '#f0f4ff',
                textShadow: '0 0 20px rgba(0,255,136,0.2)',
              }}
            >
              Nessun Breach Rilevato
            </h2>
            <p
              className={clsx(
                'font-mono text-sm text-center transition-all duration-500',
                step >= 2 ? 'opacity-100' : 'opacity-0'
              )}
              style={{ color: '#8899bb' }}
            >
              <span style={{ color: '#00aaff' }}>{email}</span> non risulta in nessun database di leak conosciuto.
            </p>
          </div>

          {/* Separatore */}
          <div
            className={clsx('h-px mb-5 transition-all duration-500', step >= 3 ? 'opacity-100' : 'opacity-0')}
            style={{ background: 'linear-gradient(90deg, transparent, rgba(0,255,136,0.2), transparent)' }}
          />

          {/* ── Statistiche scansione ────────────────────────── */}
          <div
            className={clsx(
              'grid grid-cols-3 gap-3 mb-5 transition-all duration-500',
              step >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
          >
            <StatCard
              label={'Record scansionati'}
              value={formatCounter(counterVal)}
              sub={'database globali'}
              color="#00ff88"
            />
            <StatCard
              label={'Breach trovati'}
              value="0"
              sub={'risultato pulito'}
              color="#00ff88"
              highlight
            />
            <StatCard
              label={'Verifica eseguita'}
              value={scanDate}
              sub={'in tempo reale'}
              color="#0066ff"
            />
          </div>

          {/* ── Database controllati ─────────────────────────── */}
          <div
            className={clsx(
              'rounded p-4 mb-5 transition-all duration-500',
              step >= 3 ? 'opacity-100' : 'opacity-0'
            )}
            style={{
              background: 'rgba(0,255,136,0.03)',
              border: '1px solid rgba(0,255,136,0.1)',
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Database size={12} style={{ color: '#00ff88' }} />
              <span
                className="font-mono text-[0.6rem] tracking-[0.18em] uppercase"
                style={{ color: '#00ff88' }}
              >
                Database verificati
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DATABASES_CHECKED.map((db, i) => (
                <div
                  key={i}
                  className="flex items-center gap-1.5"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <CheckCircle2 size={10} style={{ color: '#00ff88', flexShrink: 0 }} />
                  <div className="min-w-0">
                    <div className="font-mono text-[0.6rem] text-slate-400 truncate"> {/* Sostituito orvex-text-secondary */}
                      {db.name}
                    </div>
                    <div
                      className="font-mono text-[0.55rem] tracking-wider"
                      style={{ color: '#445566' }}
                    >
                      {db.records} record
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Avviso monitoraggio continuo ─────────────────── */}
          <div
            className={clsx(
              'rounded p-4 mb-6 transition-all duration-500',
              step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
            style={{
              background: 'rgba(0,102,255,0.05)',
              border: '1px solid rgba(0,102,255,0.15)',
            }}
          >
            <div className="flex items-start gap-3">
              <Eye size={14} style={{ color: '#0066ff', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p className="font-mono text-xs text-slate-400 leading-relaxed"> {/* Sostituito orvex-text-secondary */}
                  <span style={{ color: '#0066ff' }} className="font-bold">Attenzione:</span> nuovi breach vengono pubblicati ogni giorno. Un risultato pulito oggi non garantisce la sicurezza futura. Il monitoraggio continuo è essenziale.
                </p>
              </div>
            </div>
          </div>

          {/* ── CTA Premium (soft) ───────────────────────────── */}
          <div
            className={clsx(
              'flex flex-col sm:flex-row items-center gap-3 transition-all duration-500',
              step >= 4 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            )}
          >
            <button
              onClick={onPremium}
              className="w-full sm:flex-1 flex items-center justify-center gap-2
                         font-mono text-xs font-bold tracking-[0.12em] uppercase
                         text-white py-3.5 px-5 rounded transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(0,102,255,0.85) 0%, rgba(0,60,180,0.85) 100%)',
                border: '1px solid rgba(0,170,255,0.4)',
                boxShadow: '0 0 14px rgba(0,102,255,0.25)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(0,102,255,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 14px rgba(0,102,255,0.25)' }}
            >
              <Star size={13} />
              Attiva monitoraggio Premium
            </button>

            <button
              onClick={onReset}
              className="w-full sm:w-auto flex items-center justify-center gap-2 font-mono text-xs tracking-widest uppercase
                         text-slate-400 hover:text-slate-200 py-3.5 px-4
                         rounded border border-slate-800 hover:border-slate-700
                         transition-all duration-200" // Ripulite classi custom orvex
            >
              <RotateCcw size={12} />
              Nuova scansione
            </button>
          </div>

        </div>
      </div>

      {/* ── Timestamp footer ──────────────────────────────────── */}
      <div className="flex items-center gap-2 mt-3 px-1">
        <Clock size={10} style={{ color: '#445566' }} />
        <span className="font-mono text-[0.55rem] tracking-widest text-slate-500"> {/* Sostituito orvex-text-muted */}
          Scansione completata · {new Date().toLocaleTimeString('it-IT')} · ID: {scanId} {/* Utilizzo dello stato per l'ID fisso */}
        </span>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes safe-ring-1 {
          0%   { transform: scale(1);   opacity: 0.8; }
          100% { transform: scale(1.6); opacity: 0;   }
        }
      `}</style>
    </div>
  )
}

// ── Sub-component: StatCard ─────────────────────────────────────
function StatCard({ label, value, sub, color, highlight = false }) {
  return (
    <div
      className="rounded p-3 text-center"
      style={{
        background: highlight ? `rgba(0,255,136,0.06)` : 'rgba(5,8,15,0.8)',
        border: `1px solid ${highlight ? 'rgba(0,255,136,0.2)' : 'rgba(0,102,255,0.1)'}`,
      }}
    >
      <div
        className="font-mono font-bold text-sm sm:text-base mb-0.5 tabular-nums"
        style={{ color }}
      >
        {value}
      </div>
      <div className="font-mono text-[0.58rem] text-slate-400 leading-tight mb-0.5"> {/* Sostituito orvex-text-secondary */}
        {label}
      </div>
      <div className="font-mono text-[0.53rem] tracking-wider" style={{ color: '#445566' }}>
        {sub}
      </div>
    </div>
  )
}