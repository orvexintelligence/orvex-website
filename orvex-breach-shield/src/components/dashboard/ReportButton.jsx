import { useState, useEffect, useRef } from 'react'
import { jsPDF } from 'jspdf'
import {
  FileText, Download, Lock, CheckCircle2,
  AlertTriangle, BarChart2, Eye, Loader2,
} from 'lucide-react'
import clsx from 'clsx'
import { MOCK_EMPLOYEES, DASHBOARD_STATS } from '@data/breachDatabase'

// ─────────────────────────────────────────────────────────────────
//  ReportButton — Scarica Report PDF Intelligence
//
//  Props:
//    email      → string, email del report
//    isPaid     → bool, se true sblocca il download reale
//    onUpgrade  → callback per aprire il flusso di acquisto
// ─────────────────────────────────────────────────────────────────

// ── jsPDF Report Generator ───────────────────────────────────────
//
//  Genera un PDF A4 professionale con:
//   • Header navy con branding Orvex
//   • Health Score bar (34/100) + badge livello rischio
//   • Grid statistiche (7 minacce, 12 dark web, alert critici, ecc.)
//   • Tabella dipendenti esposti con status badge colorati
//   • Footer con info documento
//
function generateOrvexPDF(email) {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })
  const W    = 210   // larghezza A4 mm
  const M    = 14    // margine sinistro/destro
  const CW   = W - M * 2  // larghezza contenuto

  const now    = new Date().toLocaleString('it-IT', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
  const domain = email.includes('@') ? email.split('@')[1] : 'N/A'

  // ── Palette colori (RGB 0-255) ─────────────────────────────────
  const C = {
    navy:    [8,  14, 38],
    blue:    [0,  102, 255],
    blueL:   [0,  80,  200],
    cyan:    [0,  180, 255],
    red:     [210, 35, 60],
    redL:    [255, 235, 238],
    green:   [0,  160, 80],
    greenL:  [232, 248, 240],
    orange:  [230, 110, 0],
    orangeL: [255, 243, 224],
    dark:    [28,  38, 58],
    muted:   [110, 125, 150],
    light:   [243, 246, 255],
    white:   [255, 255, 255],
    border:  [200, 210, 230],
  }

  const setFill  = (c) => doc.setFillColor(c[0], c[1], c[2])
  const setDraw  = (c) => doc.setDrawColor(c[0], c[1], c[2])
  const setTxt   = (c) => doc.setTextColor(c[0], c[1], c[2])
  const bold     = ()  => doc.setFont('helvetica', 'bold')
  const normal   = ()  => doc.setFont('helvetica', 'normal')
  const sz       = (n) => doc.setFontSize(n)

  // ══════════════════════════════════════════════════════════════
  //  HEADER — barra navy con logo e titolo
  // ══════════════════════════════════════════════════════════════
  setFill(C.navy); doc.rect(0, 0, W, 30, 'F')

  // Accent line top
  setFill(C.blue); doc.rect(0, 0, W, 1.2, 'F')

  // Titolo sinistro
  setTxt(C.white); bold(); sz(15)
  doc.text('ORVEX BREACH SHIELD', M, 12)
  normal(); sz(8.5); setTxt([160, 180, 220])
  doc.text('SECURITY REPORT  —  DOMAIN WATCH', M, 19)

  // Badge PREMIUM (top-right)
  setFill(C.blue)
  doc.rect(W - M - 26, 5, 26, 7.5, 'F')
  setTxt(C.white); bold(); sz(7)
  doc.text('PREMIUM', W - M - 13, 10, { align: 'center' })

  // Data generazione (top-right sotto badge)
  setTxt([120, 140, 180]); normal(); sz(6.5)
  doc.text(now, W - M, 20, { align: 'right' })

  // ══════════════════════════════════════════════════════════════
  //  METADATA BLOCK
  // ══════════════════════════════════════════════════════════════
  let y = 36
  const meta = [
    ['Email analizzata',   email  ],
    ['Dominio monitorato', domain ],
    ['Generato da',        'Orvex Intelligence v2.1'],
  ]
  meta.forEach(([label, value]) => {
    setTxt(C.muted); normal(); sz(8.5)
    doc.text(label + ':', M, y)
    setTxt(C.dark); bold(); sz(8.5)
    doc.text(value, M + 42, y)
    y += 6
  })

  // Divider
  y += 2
  setDraw(C.blue); doc.setLineWidth(0.25)
  doc.line(M, y, W - M, y)
  y += 7

  // ══════════════════════════════════════════════════════════════
  //  DOMAIN HEALTH SCORE
  // ══════════════════════════════════════════════════════════════
  setFill(C.light); setDraw(C.border); doc.setLineWidth(0.15)
  doc.rect(M, y, CW, 21, 'FD')

  // Accent left
  setFill(C.red); doc.rect(M, y, 2, 21, 'F')

  // Label
  setTxt(C.muted); normal(); sz(7.5); bold()
  doc.text('DOMAIN HEALTH SCORE', M + 5, y + 6)

  // Score
  setTxt(C.red); sz(24); bold()
  doc.text('34', M + 5, y + 17)
  setTxt(C.dark); sz(11); normal()
  doc.text('/100', M + 16, y + 17)

  // Progress bar track
  const bx = M + 36, by = y + 12, bw = CW - 60, bh = 4.5
  setFill(C.border); doc.rect(bx, by, bw, bh, 'F')
  // Fill 34%
  setFill(C.red); doc.rect(bx, by, bw * 0.34, bh, 'F')
  // Marker text
  setTxt(C.muted); normal(); sz(6.5)
  doc.text('0', bx, by + bh + 4)
  doc.text('100', bx + bw - 4, by + bh + 4)

  // Livello badge (destra)
  setFill(C.red)
  doc.rect(W - M - 30, y + 6, 30, 9, 'F')
  setTxt(C.white); bold(); sz(7.5)
  doc.text('LIVELLO: ALTO', W - M - 15, y + 11.8, { align: 'center' })

  y += 28

  // ══════════════════════════════════════════════════════════════
  //  STATS GRID 2 × 2
  // ══════════════════════════════════════════════════════════════
  const STATS = [
    { label: 'Minacce Attive',      value: String(DASHBOARD_STATS.activeThreat),    color: C.red,    labelBg: C.redL    },
    { label: 'Dark Web Mentions',   value: String(DASHBOARD_STATS.darkWebMentions),  color: C.orange, labelBg: C.orangeL },
    { label: 'Account Monitorati',  value: String(DASHBOARD_STATS.monitoredEmails),  color: C.blue,   labelBg: C.light   },
    { label: 'Alert Critici',       value: String(DASHBOARD_STATS.criticalAlerts),   color: C.red,    labelBg: C.redL    },
  ]

  const sw = (CW - 4) / 2
  STATS.forEach((s, i) => {
    const col = i % 2
    const row = Math.floor(i / 2)
    const sx  = M + col * (sw + 4)
    const sy  = y + row * 19

    setFill(C.light); setDraw(C.border); doc.setLineWidth(0.15)
    doc.rect(sx, sy, sw, 17, 'FD')

    // Accent left border
    setFill(s.color); doc.rect(sx, sy, 2, 17, 'F')

    bold(); sz(7.5); setTxt(C.dark)
    doc.text(s.label, sx + 5, sy + 5.5)

    bold(); sz(18); setTxt(s.color)
    doc.text(s.value, sx + 5, sy + 14)
  })

  y += 42

  // Divider
  setDraw(C.blue); doc.setLineWidth(0.25)
  doc.line(M, y, W - M, y)
  y += 7

  // ══════════════════════════════════════════════════════════════
  //  TABELLA DIPENDENTI ESPOSTI
  // ══════════════════════════════════════════════════════════════
  bold(); sz(11); setTxt(C.dark)
  doc.text('DIPENDENTI ESPOSTI — ANALISI DETTAGLIATA', M, y)
  y += 2

  // Conteggio rapido
  const exposed = MOCK_EMPLOYEES.filter(e => e.status === 'breached').length
  normal(); sz(7.5); setTxt(C.muted)
  doc.text(
    `${exposed} su ${MOCK_EMPLOYEES.length} dipendenti risultano esposti in almeno un breach`,
    M, y + 4
  )
  y += 9

  // Header tabella
  const COLS = [
    { label: 'NOME',           x: M,          w: 42 },
    { label: 'EMAIL',          x: M + 42,      w: 52 },
    { label: 'RUOLO',          x: M + 94,      w: 26 },
    { label: 'BREACH',         x: M + 120,     w: 16 },
    { label: 'ULTIMO BREACH',  x: M + 136,     w: 34 },
    { label: 'STATO',          x: M + 170,     w: 26 },
  ]
  const tableW = 26 + 170 - M   // larghezza totale = ultimo x + w - M = 182

  setFill(C.navy); doc.rect(M, y, CW, 7, 'F')
  COLS.forEach(col => {
    setTxt([170, 190, 225]); bold(); sz(6.5)
    doc.text(col.label, col.x + 1.5, y + 4.8)
  })
  y += 7

  // Righe dipendenti
  MOCK_EMPLOYEES.forEach((emp, i) => {
    const rh = 8
    const breached = emp.status === 'breached'

    // Zebra striping
    if (i % 2 === 0) {
      setFill([248, 250, 255]); doc.rect(M, y, CW, rh, 'F')
    } else {
      setFill(C.white); doc.rect(M, y, CW, rh, 'F')
    }

    // Indicatore stato (bordo sinistro colorato)
    setFill(breached ? C.red : C.green)
    doc.rect(M, y, 1.5, rh, 'F')

    // Testo colonne
    const rowData = [
      { col: COLS[0], text: emp.name,                    f: 'bold'   },
      { col: COLS[1], text: emp.email,                   f: 'normal' },
      { col: COLS[2], text: emp.role,                    f: 'normal' },
      { col: COLS[3], text: String(emp.breachCount),     f: 'bold'   },
      { col: COLS[4], text: emp.lastBreach || '—',       f: 'normal' },
    ]

    rowData.forEach(({ col, text, f }) => {
      doc.setFont('helvetica', f); sz(7.5); setTxt(C.dark)
      // Truncate testo se troppo lungo
      const maxW = col.w - 2
      const truncated = doc.getStringUnitWidth(text) * 7.5 / doc.internal.scaleFactor > maxW
        ? text.slice(0, Math.floor(maxW / 2)) + '...'
        : text
      doc.text(truncated, col.x + 1.5, y + 5.2)
    })

    // Badge STATO
    const sc = COLS[5]
    if (breached) {
      setFill(C.redL);   doc.rect(sc.x + 1, y + 1.5, sc.w - 2, 5, 'F')
      setTxt(C.red);     bold(); sz(6.5)
      doc.text('ESPOSTO', sc.x + sc.w / 2, y + 5.2, { align: 'center' })
    } else {
      setFill(C.greenL); doc.rect(sc.x + 1, y + 1.5, sc.w - 2, 5, 'F')
      setTxt(C.green);   bold(); sz(6.5)
      doc.text('SICURO', sc.x + sc.w / 2, y + 5.2, { align: 'center' })
    }

    // Divisore riga
    setDraw(C.border); doc.setLineWidth(0.08)
    doc.line(M, y + rh, M + CW, y + rh)
    y += rh
  })

  y += 6

  // ══════════════════════════════════════════════════════════════
  //  RACCOMANDAZIONI
  // ══════════════════════════════════════════════════════════════
  setDraw(C.blue); doc.setLineWidth(0.25)
  doc.line(M, y, W - M, y)
  y += 6

  bold(); sz(10); setTxt(C.dark)
  doc.text('RACCOMANDAZIONI PRIORITARIE', M, y)
  y += 6

  const recs = [
    '1.  Reimpostare immediatamente le password degli account compromessi (CEO, Dev Lead, Finance).',
    '2.  Attivare l\'autenticazione a due fattori (2FA) su tutti gli account aziendali.',
    '3.  Condurre una verifica degli accessi privilegiati entro 48 ore.',
    '4.  Monitorare i canali dark web per nuove menzioni del dominio nelle prossime 72 ore.',
  ]
  recs.forEach(rec => {
    normal(); sz(7.5); setTxt(C.dark)
    doc.text(rec, M, y)
    y += 5.5
  })

  // ══════════════════════════════════════════════════════════════
  //  FOOTER
  // ══════════════════════════════════════════════════════════════
  const footY = 285
  setFill(C.navy); doc.rect(0, footY, W, 12, 'F')
  setTxt([160, 180, 220]); normal(); sz(7)
  doc.text('ORVEX INTELLIGENCE — Documento riservato e confidenziale', M, footY + 5)
  doc.text('www.orvex.io  |  intelligence@orvex.io', W - M, footY + 5, { align: 'right' })
  setTxt([80, 100, 140]); sz(6.5)
  doc.text('Pagina 1 di 1', W / 2, footY + 9.5, { align: 'center' })

  return doc
}

// ─────────────────────────────────────────────────────────────────

// Fasi della generazione report (simulate)
const GENERATION_STEPS = [
  'Raccolta dati intelligence...',
  'Analisi vettori di rischio...',
  'Correlazione breach database...',
  'Compilazione sezioni critiche...',
  'Cifratura documento...',
  'Report pronto.',
]

// Statistiche preview (card nella UI)
const REPORT_STATS = [
  { icon: FileText,      label: 'Pagine totali',    value: '47',     color: '#0066ff' },
  { icon: AlertTriangle, label: 'Sezioni critiche', value: '3',      color: '#ff4444' },
  { icon: BarChart2,     label: 'Grafici analitici',value: '12',     color: '#ffaa00' },
  { icon: Eye,           label: 'Fonti monitorate', value: '1.200+', color: '#00aaff' },
]

export default function ReportButton({ email = '', isPaid = false, onUpgrade }) {
  const [phase,    setPhase]    = useState('idle')   // idle | generating | done | locked
  const [progress, setProgress] = useState(0)
  const [stepIdx,  setStepIdx]  = useState(0)
  const [stepText, setStepText] = useState('')
  const rafRef   = useRef(null)
  const startRef = useRef(null)

  const DURATION = 2800

  const handleClick = () => {
    if (phase === 'idle') {
      setPhase('generating')
      setProgress(0)
      setStepIdx(0)
      setStepText(GENERATION_STEPS[0])
      startRef.current = performance.now()

    } else if (phase === 'done') {
      if (isPaid) {
        // ── Genera e scarica il PDF reale via jsPDF ───────────────
        const filename = `orvex_report_${(email.split('@')[0] || 'user')}.pdf`
        try {
          const doc = generateOrvexPDF(email)
          doc.save(filename)
        } catch (err) {
          console.error('[Orvex] PDF generation error:', err)
        }
      } else {
        setPhase('locked')
      }
    }
  }

  // Animazione progress bar + step text
  useEffect(() => {
    if (phase !== 'generating') return

    const tick = (now) => {
      const elapsed = now - startRef.current
      const pct     = Math.min((elapsed / DURATION) * 100, 100)
      setProgress(pct)

      const idx = Math.min(
        Math.floor((elapsed / DURATION) * GENERATION_STEPS.length),
        GENERATION_STEPS.length - 1
      )
      if (idx !== stepIdx) {
        setStepIdx(idx)
        setStepText(GENERATION_STEPS[idx])
      }

      if (pct < 100) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setTimeout(() => setPhase('done'), 300)
      }
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [phase]) // eslint-disable-line

  return (
    <div
      className="rounded-xs overflow-hidden"
      style={{
        background: 'rgba(5,8,15,0.9)',
        border: '1px solid rgba(0,102,255,0.12)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* ── Header ────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(0,102,255,0.1)' }}
      >
        <div className="flex items-center gap-2">
          <FileText size={13} style={{ color: '#0066ff' }} />
          <span className="font-mono text-[0.65rem] tracking-[0.18em] uppercase"
            style={{ color: '#f0f4ff' }}>
            Report PDF Intelligence
          </span>
        </div>
        <span
          className="font-mono text-[0.55rem] tracking-widest uppercase px-2 py-0.5 rounded-xs"
          style={{
            color: '#ffaa00',
            background: 'rgba(255,170,0,0.08)',
            border: '1px solid rgba(255,170,0,0.2)',
          }}
        >
          PREMIUM
        </span>
      </div>

      <div className="px-4 pt-4 pb-5">

        {/* ── Preview statistiche ───────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {REPORT_STATS.map(({ icon: Icon, label, value, color }, i) => (
            <div
              key={i}
              className="flex flex-col items-center py-2.5 rounded-xs"
              style={{
                background: `${color}06`,
                border: `1px solid ${color}15`,
              }}
            >
              <Icon size={12} style={{ color, marginBottom: '4px' }} />
              <span className="font-mono font-bold text-sm tabular-nums" style={{ color }}>
                {value}
              </span>
              <span className="font-mono text-[0.53rem] tracking-wide text-center mt-0.5"
                style={{ color: '#445566' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        {/* ── Anteprima indice (censurato) ──────────────────── */}
        <div
          className="rounded-xs p-3 mb-4 relative overflow-hidden"
          style={{
            background: 'rgba(8,12,20,0.6)',
            border: '1px solid rgba(0,102,255,0.08)',
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[0.58rem] tracking-widest uppercase"
              style={{ color: '#0066ff' }}>
              Anteprima indice
            </span>
          </div>

          {[
            { num: '01', title: 'Executive Summary',         locked: false },
            { num: '02', title: 'Analisi Breach Rilevati',   locked: false },
            { num: '03', title: 'Mappa Vettori di Attacco',  locked: true  },
            { num: '04', title: 'Dark Web Exposure Report',  locked: true  },
            { num: '05', title: 'Piano di Remediation',      locked: true  },
          ].map((ch, i) => (
            <div key={i} className="flex items-center gap-2 py-1">
              <span className="font-mono text-[0.6rem] tabular-nums flex-shrink-0"
                style={{ color: '#0066ff', opacity: 0.5 }}>
                {ch.num}
              </span>
              <span
                className={clsx(
                  'font-mono text-[0.65rem] flex-1',
                  ch.locked && 'blur-[2px] select-none',
                )}
                style={{ color: ch.locked ? '#445566' : '#8899bb' }}
              >
                {ch.title}
              </span>
              {ch.locked && (
                <Lock size={9} style={{ color: '#445566', flexShrink: 0 }} />
              )}
            </div>
          ))}

          <div
            className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none"
            style={{ background: 'linear-gradient(transparent, rgba(5,8,15,0.9))' }}
          />
        </div>

        {/* ── Fase: IDLE ────────────────────────────────────── */}
        {phase === 'idle' && (
          <button
            onClick={handleClick}
            className="w-full flex items-center justify-center gap-2.5
                       font-mono text-xs font-bold tracking-[0.12em] uppercase
                       text-white py-4 rounded-xs transition-all duration-200"
            style={{
              background: 'linear-gradient(135deg, rgba(0,80,200,0.9) 0%, rgba(0,50,150,0.9) 100%)',
              border: '1px solid rgba(0,170,255,0.3)',
              boxShadow: '0 0 16px rgba(0,102,255,0.2)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.boxShadow = '0 0 28px rgba(0,102,255,0.5)'
              e.currentTarget.style.borderColor = 'rgba(0,212,255,0.5)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = '0 0 16px rgba(0,102,255,0.2)'
              e.currentTarget.style.borderColor = 'rgba(0,170,255,0.3)'
            }}
          >
            <FileText size={14} />
            Genera Report Intelligence
          </button>
        )}

        {/* ── Fase: GENERATING ──────────────────────────────── */}
        {phase === 'generating' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Loader2 size={12} className="animate-spin flex-shrink-0"
                style={{ color: '#0066ff' }} />
              <span className="font-mono text-xs" style={{ color: '#8899bb' }}>
                {stepText}
              </span>
            </div>

            <div>
              <div className="flex justify-between mb-1">
                <span className="font-mono text-[0.57rem] tracking-widest uppercase"
                  style={{ color: '#445566' }}>
                  Generazione
                </span>
                <span className="font-mono text-[0.57rem] tabular-nums"
                  style={{ color: '#0066ff' }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-1.5 rounded-xs overflow-hidden"
                style={{ background: 'rgba(0,102,255,0.08)' }}>
                <div
                  className="h-full rounded-xs"
                  style={{
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #0066ff, #00d4ff)',
                    boxShadow: '0 0 6px rgba(0,212,255,0.5)',
                    transition: 'width 0.05s linear',
                  }}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1">
              {GENERATION_STEPS.map((step, i) => (
                <span
                  key={i}
                  className="font-mono text-[0.53rem] px-1.5 py-0.5 rounded-xs transition-all duration-300"
                  style={{
                    color:      i <= stepIdx ? '#0066ff' : '#1a2535',
                    background: i <= stepIdx ? 'rgba(0,102,255,0.08)' : 'rgba(0,102,255,0.03)',
                    border:     `1px solid ${i <= stepIdx ? 'rgba(0,102,255,0.2)' : 'rgba(0,102,255,0.06)'}`,
                  }}
                >
                  {i < stepIdx ? '✓' : i === stepIdx ? '◈' : '○'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Fase: DONE ────────────────────────────────────── */}
        {phase === 'done' && (
          <div className="space-y-3">
            <div
              className="flex items-center gap-2.5 p-3 rounded-xs"
              style={{
                background: 'rgba(0,255,136,0.05)',
                border: '1px solid rgba(0,255,136,0.2)',
              }}
            >
              <CheckCircle2 size={16} style={{ color: '#00ff88', flexShrink: 0 }} />
              <div>
                <p className="font-mono text-xs font-bold" style={{ color: '#00ff88' }}>
                  Report generato con successo
                </p>
                <p className="font-mono text-[0.6rem]" style={{ color: '#445566' }}>
                  orvex_report_{email.split('@')[0] || 'user'}.pdf · Domain Watch · A4
                </p>
              </div>
            </div>

            <button
              onClick={handleClick}
              className="w-full flex items-center justify-center gap-2
                         font-mono text-xs font-bold tracking-[0.12em] uppercase
                         text-white py-3.5 rounded-xs transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, rgba(0,200,100,0.8), rgba(0,150,70,0.8))',
                border: '1px solid rgba(0,255,136,0.3)',
                boxShadow: '0 0 16px rgba(0,255,136,0.2)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(0,255,136,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(0,255,136,0.2)' }}
            >
              <Download size={13} />
              Scarica Report PDF
            </button>
          </div>
        )}

        {/* ── Fase: LOCKED ──────────────────────────────────── */}
        {phase === 'locked' && (
          <div className="space-y-3">
            <div
              className="flex items-start gap-3 p-4 rounded-xs"
              style={{
                background: 'rgba(255,170,0,0.05)',
                border: '1px solid rgba(255,170,0,0.2)',
              }}
            >
              <Lock size={18} style={{ color: '#ffaa00', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p className="font-mono text-xs font-bold mb-1" style={{ color: '#ffaa00' }}>
                  Funzione Premium richiesta
                </p>
                <p className="font-mono text-[0.62rem] leading-relaxed" style={{ color: '#8899bb' }}>
                  Il download del Report PDF Intelligence è disponibile esclusivamente
                  per gli abbonati Orvex Premium. Accedi a intelligence avanzata,
                  monitoraggio continuo e report esportabili.
                </p>
              </div>
            </div>

            <button
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-2
                         font-mono text-xs font-bold tracking-[0.12em] uppercase
                         text-white py-3.5 rounded-xs transition-all duration-200"
              style={{
                background: 'linear-gradient(135deg, #cc0022, #990011)',
                border: '1px solid rgba(255,80,80,0.4)',
                boxShadow: '0 0 16px rgba(255,34,68,0.3)',
                animation: 'cta-pulse-report 2s ease-in-out infinite',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 28px rgba(255,34,68,0.6)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(255,34,68,0.3)' }}
            >
              <Lock size={13} />
              Sblocca con Premium
            </button>

            <button
              onClick={() => setPhase('idle')}
              className="w-full font-mono text-[0.6rem] tracking-widest uppercase
                         text-orvex-text-muted hover:text-orvex-text-secondary
                         transition-colors py-1"
            >
              ← Torna al report
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes cta-pulse-report {
          0%, 100% { box-shadow: 0 0 16px rgba(255,34,68,0.3); }
          50%       { box-shadow: 0 0 28px rgba(255,34,68,0.6), 0 0 50px rgba(255,34,68,0.2); }
        }
      `}</style>
    </div>
  )
}
