import { useState, useEffect, useRef } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { AlertTriangle, TrendingUp, Zap, Shield } from 'lucide-react'
import { THREAT_HISTORY, DASHBOARD_STATS } from '@data/breachDatabase'

// ─────────────────────────────────────────────────────────────────
//  ThreatMeter — Gauge livello minaccia + sparkline 7 giorni
// ─────────────────────────────────────────────────────────────────

// Converte 0-100 in coordinate sull'arco SVG (semicerchio superiore)
function polarToXY(pct, cx, cy, r) {
  // Arco da 210° a 330° (210deg = start, span 300deg)
  const angle = (210 + pct * 3) * (Math.PI / 180)
  return {
    x: cx + r * Math.cos(angle),
    y: cy + r * Math.sin(angle),
  }
}

// Genera il percorso SVG dell'arco
function arcPath(cx, cy, r, startPct, endPct) {
  const start   = polarToXY(startPct, cx, cy, r)
  const end     = polarToXY(endPct,   cx, cy, r)
  const large   = endPct - startPct > 50 ? 1 : 0
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y}`
}

// Colore dell'ago in base al livello
function gaugeColor(pct) {
  if (pct >= 75) return { primary: '#ff2244', glow: 'rgba(255,34,68,0.8)',  label: 'CRITICO' }
  if (pct >= 50) return { primary: '#ff6600', glow: 'rgba(255,102,0,0.8)', label: 'ALTO'    }
  if (pct >= 25) return { primary: '#ffaa00', glow: 'rgba(255,170,0,0.8)', label: 'MEDIO'   }
  return              { primary: '#00ff88', glow: 'rgba(0,255,136,0.8)',  label: 'BASSO'   }
}

// Tooltip Recharts custom
function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xs px-2.5 py-1.5 font-mono"
      style={{
        background: 'rgba(8,12,20,0.96)',
        border: '1px solid rgba(0,102,255,0.25)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.6)',
      }}
    >
      <p className="text-[0.6rem] tracking-widest uppercase mb-1"
        style={{ color: '#445566' }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[0.65rem] tabular-nums"
          style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  )
}

export default function ThreatMeter({ threatLevel = 73 }) {
  const [displayLevel, setDisplayLevel] = useState(0)
  const [counterVal,   setCounter]      = useState(0)
  const rafRef = useRef(null)

  // Animazione gauge e contatore al mount
  useEffect(() => {
    const target   = threatLevel
    const duration = 1600
    const start    = performance.now()

    const tick = (now) => {
      const elapsed = now - start
      const pct     = Math.min(elapsed / duration, 1)
      const eased   = 1 - Math.pow(1 - pct, 3)       // cubic ease-out
      setDisplayLevel(Math.round(target * eased))
      setCounter(Math.round(DASHBOARD_STATS.activeThreat * eased))
      if (pct < 1) rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [threatLevel])

  const cfg     = gaugeColor(displayLevel)
  const CX      = 120
  const CY      = 90
  const R_OUTER = 76
  const R_INNER = 58
  const R_NEEDLE= 66

  const needlePt = polarToXY(displayLevel, CX, CY, R_NEEDLE)

  return (
    <div
      className="rounded-xs overflow-hidden h-full flex flex-col"
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
          <Zap size={13} style={{ color: '#ff6600' }} />
          <span className="font-mono text-[0.65rem] tracking-[0.18em] uppercase"
            style={{ color: '#f0f4ff' }}>
            Threat Level
          </span>
        </div>
        <span
          className="font-mono text-[0.58rem] tracking-widest uppercase px-2 py-0.5 rounded-xs"
          style={{
            color: cfg.primary,
            background: `${cfg.primary}15`,
            border: `1px solid ${cfg.primary}30`,
            boxShadow: `0 0 6px ${cfg.primary}30`,
          }}
        >
          {cfg.label}
        </span>
      </div>

      {/* ── Gauge SVG ─────────────────────────────────────────── */}
      <div className="flex items-center justify-center pt-2 pb-0">
        <svg
          viewBox="0 0 240 175"
          width="100%"
          style={{ maxWidth: '240px' }}
        >
          <defs>
            {/* Gradiente colore gauge */}
            <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="#00ff88" />
              <stop offset="33%"  stopColor="#ffaa00" />
              <stop offset="66%"  stopColor="#ff6600" />
              <stop offset="100%" stopColor="#ff2244" />
            </linearGradient>
            {/* Glow filter */}
            <filter id="gaugeGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Track background */}
          <path
            d={arcPath(CX, CY, R_OUTER, 0, 100)}
            fill="none"
            stroke="rgba(0,102,255,0.08)"
            strokeWidth="20"
            strokeLinecap="round"
          />

          {/* Segmenti colorati (track) */}
          {[
            { start: 0,  end: 25,  color: '#00ff8830' },
            { start: 25, end: 50,  color: '#ffaa0025' },
            { start: 50, end: 75,  color: '#ff660025' },
            { start: 75, end: 100, color: '#ff224425' },
          ].map((seg, i) => (
            <path
              key={i}
              d={arcPath(CX, CY, R_OUTER, seg.start, seg.end)}
              fill="none"
              stroke={seg.color}
              strokeWidth="20"
            />
          ))}

          {/* Fill arco attivo */}
          {displayLevel > 0 && (
            <path
              d={arcPath(CX, CY, R_OUTER, 0, displayLevel)}
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth="20"
              strokeLinecap="round"
              filter="url(#gaugeGlow)"
              style={{ transition: 'none' }}
            />
          )}

          {/* Tacche di calibrazione */}
          {[0, 25, 50, 75, 100].map((pct) => {
            const outer = polarToXY(pct, CX, CY, R_OUTER + 4)
            const inner = polarToXY(pct, CX, CY, R_OUTER - 24)
            return (
              <line
                key={pct}
                x1={outer.x} y1={outer.y}
                x2={inner.x} y2={inner.y}
                stroke="rgba(0,102,255,0.25)"
                strokeWidth="1"
              />
            )
          })}

          {/* Etichette calibrazione */}
          {[
            { pct: 0,   label: '0'   },
            { pct: 25,  label: '25'  },
            { pct: 50,  label: '50'  },
            { pct: 75,  label: '75'  },
            { pct: 100, label: '100' },
          ].map(({ pct, label }) => {
            const pt = polarToXY(pct, CX, CY, R_OUTER + 14)
            return (
              <text
                key={pct}
                x={pt.x} y={pt.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#445566"
                fontSize="7"
                fontFamily="'JetBrains Mono', monospace"
              >
                {label}
              </text>
            )
          })}

          {/* Cerchio centro gauge */}
          <circle cx={CX} cy={CY} r="10"
            fill="rgba(8,12,20,0.95)"
            stroke={cfg.primary}
            strokeWidth="1.5"
          />
          <circle cx={CX} cy={CY} r="3"
            fill={cfg.primary}
            style={{ filter: `drop-shadow(0 0 4px ${cfg.primary})` }}
          />

          {/* Ago */}
          <line
            x1={CX} y1={CY}
            x2={needlePt.x} y2={needlePt.y}
            stroke={cfg.primary}
            strokeWidth="2.5"
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 4px ${cfg.glow})` }}
          />

          {/* Valore centrale */}
          <text
            x={CX} y={CY + 24}
            textAnchor="middle"
            fill={cfg.primary}
            fontSize="22"
            fontWeight="800"
            fontFamily="'JetBrains Mono', monospace"
            style={{ filter: `drop-shadow(0 0 8px ${cfg.glow})` }}
          >
            {displayLevel}
          </text>
          <text
            x={CX} y={CY + 36}
            textAnchor="middle"
            fill="#445566"
            fontSize="7"
            fontFamily="'JetBrains Mono', monospace"
            letterSpacing="2"
          >
            / 100
          </text>
        </svg>
      </div>

      {/* ── Counter pills ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 px-4 pb-3">
        <CounterPill
          label="Attive"
          value={counterVal}
          color="#ff2244"
          icon={<AlertTriangle size={9} />}
        />
        <CounterPill
          label="Critiche"
          value={DASHBOARD_STATS.criticalAlerts}
          color="#ff6600"
          icon={<Zap size={9} />}
        />
        <CounterPill
          label="Monitorate"
          value={DASHBOARD_STATS.monitoredEmails}
          color="#0066ff"
          icon={<Shield size={9} />}
        />
      </div>

      {/* Separatore */}
      <div className="mx-4 h-px" style={{ background: 'rgba(0,102,255,0.08)' }} />

      {/* ── Sparkline — ultimi 7 giorni ───────────────────────── */}
      <div className="px-4 pt-3 pb-4 flex-1">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp size={11} style={{ color: '#ff6600' }} />
          <span className="font-mono text-[0.57rem] tracking-widest uppercase"
            style={{ color: '#445566' }}>
            Ultimi 7 giorni
          </span>
        </div>
        <div style={{ height: '64px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={THREAT_HISTORY}
              margin={{ top: 2, right: 2, left: -32, bottom: 0 }}
            >
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff4444" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#ff4444" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="critGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ff6600" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ff6600" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="2 4"
                stroke="rgba(0,102,255,0.06)"
                vertical={false}
              />
              <XAxis
                dataKey="day"
                tick={{ fill: '#445566', fontSize: 7, fontFamily: 'JetBrains Mono' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis hide />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="threats"
                name="Minacce"
                stroke="#ff4444"
                strokeWidth={1.5}
                fill="url(#areaGrad)"
                dot={false}
                activeDot={{ r: 3, fill: '#ff4444', stroke: 'none' }}
              />
              <Area
                type="monotone"
                dataKey="critical"
                name="Critiche"
                stroke="#ff6600"
                strokeWidth={1}
                fill="url(#critGrad)"
                dot={false}
                activeDot={{ r: 2, fill: '#ff6600', stroke: 'none' }}
                strokeDasharray="3 2"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

// ── Sub-component: CounterPill ──────────────────────────────────
function CounterPill({ label, value, color, icon }) {
  return (
    <div
      className="flex flex-col items-center gap-0.5 py-2 rounded-xs"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}20`,
      }}
    >
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span className="font-mono font-bold text-sm tabular-nums">{value}</span>
      </div>
      <span className="font-mono text-[0.54rem] tracking-wide uppercase"
        style={{ color: '#445566' }}>
        {label}
      </span>
    </div>
  )
}
