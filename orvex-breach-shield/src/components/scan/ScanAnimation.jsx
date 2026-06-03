import { useState, useEffect, useRef } from 'react'
import { Terminal, Cpu, Database, Globe, ShieldAlert, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────────
//  ScanAnimation — Loader hi-tech durante la scansione
//
//  Props:
//    email        → string, email da mostrare nel terminale
//    onComplete() → callback invocato al termine della sequenza
//    duration     → ms totali della scansione (default 3800)
// ─────────────────────────────────────────────────────────────────

// Sequenza di step del terminale
const SCAN_STEPS = [
  { icon: Globe,      label: 'Connessione al server sicuro...',        color: '#0066ff' },
  { icon: Database,   label: 'Accesso al breach repository...',        color: '#0066ff' },
  { icon: Cpu,        label: 'Hash SHA-256 calcolato...',              color: '#00aaff' },
  { icon: Database,   label: 'Interrogazione database leak [v4.2]...', color: '#00aaff' },
  { icon: Globe,      label: 'Cross-referencing ComboList DB...',      color: '#00d4ff' },
  { icon: ShieldAlert,label: 'Analisi vettori d\'esposizione...',      color: '#ffaa00' },
  { icon: Terminal,   label: 'Verifica identità digitale...',          color: '#00d4ff' },
  { icon: CheckCircle2,label: 'Scansione completata.',                 color: '#00ff88' },
]

// Distribuisce i passi nel tempo totale
const buildTimeline = (duration) =>
  SCAN_STEPS.map((step, i) => ({
    ...step,
    at: Math.floor((duration * i) / SCAN_STEPS.length),
  }))

export default function ScanAnimation({
  email = '',
  onComplete,
  duration = 3800,
}) {
  const [visibleSteps, setVisibleSteps]   = useState([])
  const [progress, setProgress]           = useState(0)
  const [scanId]                          = useState(() => generateScanId())
  const [glitchActive, setGlitchActive]   = useState(false)
  const terminalRef                       = useRef(null)
  const progressRef                       = useRef(null)
  const startRef                          = useRef(null)
  const rafRef                            = useRef(null)

  // Effetto glitch periodico
  useEffect(() => {
    const id = setInterval(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 300)
    }, 1200)
    return () => clearInterval(id)
  }, [])

  // Animazione principale
  useEffect(() => {
    const timeline = buildTimeline(duration)
    startRef.current = performance.now()

    const tick = (now) => {
      const elapsed = now - startRef.current
      const pct = Math.min((elapsed / duration) * 100, 100)
      setProgress(pct)

      // Aggiunge gli step man mano che arriva il loro momento
      setVisibleSteps(
        timeline.filter(s => elapsed >= s.at).map(s => s)
      )

      if (elapsed < duration) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        // Completato
        setTimeout(() => onComplete?.(), 250)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [duration, onComplete])

  // Scroll automatico in fondo al terminale
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [visibleSteps])

  const targetHash = hashEmail(email)
  const isComplete = progress >= 100

  return (
    <div className="w-full max-w-2xl mx-auto animate-fade-up">

      {/* ── Headline ──────────────────────────────────────────── */}
      <div className="text-center mb-6">
        <div
          className={clsx(
            'font-mono font-bold text-xl sm:text-2xl tracking-[0.12em] uppercase mb-1',
            glitchActive && 'is-glitching',
          )}
          style={{
            color: '#f0f4ff',
            textShadow: '0 0 20px rgba(0,102,255,0.4)',
          }}
        >
          SCANSIONE IN CORSO
          <span className="cursor-blink" />
        </div>
        <p className="font-mono text-xs tracking-widest text-orvex-text-muted">
          TARGET:&nbsp;
          <span style={{ color: '#0066ff' }}>{email || '—'}</span>
        </p>
      </div>

      {/* ── Progress bar principale ───────────────────────────── */}
      <div className="mb-5">
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-mono text-[0.6rem] tracking-widest text-orvex-text-muted uppercase">
            Analisi
          </span>
          <span
            className="font-mono text-[0.6rem] tracking-widest tabular-nums"
            style={{ color: '#0066ff' }}
          >
            {Math.round(progress)}%
          </span>
        </div>

        {/* Track */}
        <div
          className="w-full h-1.5 rounded-xs overflow-hidden"
          style={{ background: 'rgba(0,102,255,0.08)' }}
        >
          {/* Fill */}
          <div
            ref={progressRef}
            className="h-full rounded-xs transition-none"
            style={{
              width: `${progress}%`,
              background: isComplete
                ? 'linear-gradient(90deg, #00ff88, #00cc6a)'
                : 'linear-gradient(90deg, #0066ff, #00d4ff)',
              boxShadow: isComplete
                ? '0 0 8px rgba(0,255,136,0.6)'
                : '0 0 8px rgba(0,212,255,0.6)',
            }}
          />
        </div>

        {/* Segmenti decorativi sopra la barra */}
        <div className="flex gap-px mt-1">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="flex-1 h-px transition-all duration-200"
              style={{
                background: i < (progress / 5)
                  ? 'rgba(0,170,255,0.5)'
                  : 'rgba(0,102,255,0.08)',
              }}
            />
          ))}
        </div>
      </div>

      {/* ── Terminale ─────────────────────────────────────────── */}
      <div
        className="rounded-xs overflow-hidden"
        style={{
          border: '1px solid rgba(0,102,255,0.15)',
          background: 'rgba(5,8,15,0.97)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.7), 0 0 0 1px rgba(0,102,255,0.05)',
        }}
      >
        {/* Barra titolo terminale */}
        <div
          className="flex items-center gap-2 px-3 py-2 border-b"
          style={{
            borderColor: 'rgba(0,102,255,0.1)',
            background: 'rgba(8,12,20,0.8)',
          }}
        >
          {/* Traffic lights */}
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-600/60" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-600/60" />
          </div>
          <span className="font-mono text-[0.58rem] tracking-widest text-orvex-text-muted flex-1 text-center uppercase">
            orvex-scanner — breach_check.sh
          </span>
          <span className="font-mono text-[0.55rem] text-orvex-text-muted tabular-nums">
            {scanId}
          </span>
        </div>

        {/* Output terminale */}
        <div
          ref={terminalRef}
          className="p-4 overflow-y-auto font-mono"
          style={{ minHeight: '220px', maxHeight: '260px' }}
        >
          {/* Linee statiche iniziali */}
          <TermLine prefix="$" color="#445566">
            orvex-scan --target "{email}" --mode full
          </TermLine>
          <TermLine prefix=">" color="#0066ff" mt>
            Inizializzazione motore di scansione v4.2.1
          </TermLine>
          <TermLine prefix=">" color="#445566">
            Hash target: <span style={{ color: '#00aaff' }}>{targetHash}</span>
          </TermLine>
          <TermLine prefix=">" color="#445566">
            Connecting to breach.orvex.io:443 [TLS 1.3]
          </TermLine>

          {/* Separatore */}
          <div className="my-2 h-px" style={{ background: 'rgba(0,102,255,0.1)' }} />

          {/* Step dinamici */}
          {visibleSteps.map((step, i) => {
            const Icon = step.icon
            const isLast = i === visibleSteps.length - 1
            return (
              <div
                key={i}
                className={clsx(
                  'flex items-start gap-2 py-0.5',
                  'animate-fade-up',
                )}
                style={{ animationDuration: '0.2s', animationFillMode: 'both' }}
              >
                <Icon
                  size={11}
                  style={{ color: step.color, flexShrink: 0, marginTop: '2px' }}
                />
                <span
                  className="font-mono text-xs leading-relaxed"
                  style={{ color: step.color }}
                >
                  {step.label}
                  {isLast && !isComplete && (
                    <span
                      className="inline-block w-1.5 h-3 ml-1 align-middle"
                      style={{
                        background: '#00d4ff',
                        animation: 'blink 0.8s step-end infinite',
                      }}
                    />
                  )}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Info sotto il terminale ───────────────────────────── */}
      <div className="flex justify-between items-center mt-3">
        <p className="font-mono text-[0.58rem] tracking-widest text-orvex-text-muted uppercase">
          Connessione sicura · TLS 1.3
        </p>
        <div className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#0066ff', boxShadow: '0 0 6px rgba(0,102,255,0.8)' }}
          />
          <span className="font-mono text-[0.58rem] tracking-widest text-orvex-text-muted uppercase">
            Live scan
          </span>
        </div>
      </div>
    </div>
  )
}

// ── Sub-component: TermLine ─────────────────────────────────────
function TermLine({ prefix, color, children, mt = false }) {
  return (
    <div className={clsx('flex items-start gap-2', mt && 'mt-1')}>
      <span className="font-mono text-xs flex-shrink-0" style={{ color, opacity: 0.6 }}>
        {prefix}
      </span>
      <span className="font-mono text-xs text-orvex-text-secondary leading-relaxed">
        {children}
      </span>
    </div>
  )
}

// ── Helpers ──────────────────────────────────────────────────────
function generateScanId() {
  return 'SCN-' + Math.random().toString(36).slice(2, 8).toUpperCase()
}

// Hash visivo deterministico (non crittografico — solo estetico)
function hashEmail(email) {
  if (!email) return '—'
  let h = 0x811c9dc5
  for (let i = 0; i < email.length; i++) {
    h ^= email.charCodeAt(i)
    h = (h * 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0').toUpperCase() +
    (h ^ 0xdeadbeef).toString(16).padStart(8, '0').toUpperCase()
}
