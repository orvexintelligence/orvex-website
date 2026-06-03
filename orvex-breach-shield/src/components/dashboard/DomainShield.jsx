import { useState } from 'react'
import {
  Building2, ShieldCheck, ShieldX, Search,
  ChevronDown, ChevronUp, AlertCircle, Users,
  Lock, Zap,
} from 'lucide-react'
import clsx from 'clsx'
import { MOCK_EMPLOYEES, DASHBOARD_STATS } from '@data/breachDatabase'

// ─────────────────────────────────────────────────────────────────
//  DomainShield — Monitoraggio dipendenti aziendale (mock)
// ─────────────────────────────────────────────────────────────────

const STATUS_CFG = {
  safe:    { label: 'SICURO',  color: '#00ff88', bg: 'rgba(0,255,136,0.08)',  border: 'rgba(0,255,136,0.25)',  icon: ShieldCheck },
  breached:{ label: 'ESPOSTO', color: '#ff4444', bg: 'rgba(255,68,68,0.08)',  border: 'rgba(255,68,68,0.25)',  icon: ShieldX     },
}

// Oscura parzialmente l'email per il teaser premium
function maskEmail(email) {
  const [local, domain] = email.split('@')
  const masked = local[0] + '·'.repeat(Math.max(local.length - 2, 2)) + local.slice(-1)
  return `${masked}@${domain}`
}

// Score color: 0 = critico rosso, 100 = verde
function scoreColor(score) {
  if (score >= 70) return '#00ff88'
  if (score >= 40) return '#ffaa00'
  return '#ff4444'
}

export default function DomainShield({ domain = 'corp.it', isPremium = true, onUpgrade }) {
  const [sortBy,     setSortBy]     = useState('status')   // 'status' | 'name' | 'breach'
  const [sortDir,    setSortDir]    = useState('asc')
  const [filterText, setFilter]     = useState('')
  const [expanded,   setExpanded]   = useState(null)

  const score       = DASHBOARD_STATS.domainScore
  const exposedCount = MOCK_EMPLOYEES.filter(e => e.status === 'breached').length
  const safeCount    = MOCK_EMPLOYEES.filter(e => e.status === 'safe').length

  // Sorting
  const handleSort = (field) => {
    if (sortBy === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(field); setSortDir('asc') }
  }

  const sorted = [...MOCK_EMPLOYEES]
    .filter(e =>
      !filterText ||
      e.name.toLowerCase().includes(filterText.toLowerCase()) ||
      e.role.toLowerCase().includes(filterText.toLowerCase())
    )
    .sort((a, b) => {
      let val = 0
      if (sortBy === 'status')  val = a.status.localeCompare(b.status)
      if (sortBy === 'name')    val = a.name.localeCompare(b.name)
      if (sortBy === 'breach')  val = b.breachCount - a.breachCount
      return sortDir === 'asc' ? val : -val
    })

  return (
    <div
      className="rounded-xs overflow-hidden flex flex-col h-full"
      style={{
        background: 'rgba(5,8,15,0.9)',
        border: '1px solid rgba(0,102,255,0.12)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
      }}
    >
      {/* ── Header ──────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'rgba(0,102,255,0.1)' }}
      >
        <div className="flex items-center gap-2">
          <Building2 size={13} style={{ color: '#0066ff' }} />
          <span className="font-mono text-[0.65rem] tracking-[0.18em] uppercase"
            style={{ color: '#f0f4ff' }}>
            Domain Shield
          </span>
          <span className="font-mono text-[0.58rem] px-1.5 py-0.5 rounded-xs"
            style={{
              color: '#0066ff',
              background: 'rgba(0,102,255,0.1)',
              border: '1px solid rgba(0,102,255,0.2)',
            }}>
            @{domain}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users size={10} style={{ color: '#445566' }} />
          <span className="font-mono text-[0.58rem] text-orvex-text-muted">
            {MOCK_EMPLOYEES.length} monitorati
          </span>
        </div>
      </div>

      {/* ── Score + riepilogo ─────────────────────────────── */}
      <div
        className="grid grid-cols-3 gap-3 px-4 py-3 border-b"
        style={{ borderColor: 'rgba(0,102,255,0.08)' }}
      >
        {/* Domain health score */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r="22"
                fill="none"
                stroke="rgba(0,102,255,0.08)"
                strokeWidth="5"
              />
              <circle cx="28" cy="28" r="22"
                fill="none"
                stroke={scoreColor(score)}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={`${(score / 100) * 138.2} 138.2`}
                style={{ filter: `drop-shadow(0 0 4px ${scoreColor(score)})` }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-mono font-bold text-sm"
                style={{ color: scoreColor(score) }}>
                {score}
              </span>
            </div>
          </div>
          <span className="font-mono text-[0.54rem] tracking-wide mt-1"
            style={{ color: '#445566' }}>
            HEALTH SCORE
          </span>
        </div>

        {/* Contatori */}
        <div className="col-span-2 grid grid-cols-2 gap-2">
          <MiniStat
            label="Esposti"
            value={exposedCount}
            color="#ff4444"
            icon={<ShieldX size={9} />}
          />
          <MiniStat
            label="Sicuri"
            value={safeCount}
            color="#00ff88"
            icon={<ShieldCheck size={9} />}
          />
          <MiniStat
            label="Ultimo scan"
            value={DASHBOARD_STATS.lastScan}
            color="#0066ff"
            small
          />
          <MiniStat
            label="Prossimo"
            value={DASHBOARD_STATS.nextScan}
            color="#445566"
            small
          />
        </div>
      </div>

      {/* ── Filtro + sort header ───────────────────────────── */}
      <div
        className="flex items-center gap-2 px-4 py-2 border-b"
        style={{ borderColor: 'rgba(0,102,255,0.06)' }}
      >
        {/* Search */}
        <div className="flex-1 flex items-center gap-1.5"
          style={{
            background: 'rgba(8,12,20,0.8)',
            border: '1px solid rgba(0,102,255,0.12)',
            borderRadius: '2px',
            padding: '4px 8px',
          }}
        >
          <Search size={10} style={{ color: '#445566', flexShrink: 0 }} />
          <input
            type="text"
            placeholder="Cerca dipendente..."
            value={filterText}
            onChange={e => setFilter(e.target.value)}
            className="flex-1 bg-transparent outline-none font-mono text-[0.62rem]
                       text-orvex-text-secondary placeholder:text-orvex-text-muted"
          />
        </div>

        {/* Sort toggles */}
        <SortBtn label="Nome"   field="name"   active={sortBy === 'name'}   dir={sortDir} onClick={() => handleSort('name')} />
        <SortBtn label="Breach" field="breach" active={sortBy === 'breach'} dir={sortDir} onClick={() => handleSort('breach')} />
        <SortBtn label="Status" field="status" active={sortBy === 'status'} dir={sortDir} onClick={() => handleSort('status')} />
      </div>

      {/* ── Lista dipendenti ──────────────────────────────── */}
      <div className="relative flex-1">
        <div
          className="overflow-y-auto"
          style={{ maxHeight: isPremium ? '280px' : '200px' }}
        >
          {sorted.length === 0 ? (
            <div className="flex items-center justify-center h-16">
              <span className="font-mono text-xs text-orvex-text-muted">Nessun risultato</span>
            </div>
          ) : sorted.map((emp, idx) => (
            <EmployeeRow
              key={emp.email}
              employee={emp}
              isExpanded={expanded === idx}
              onToggle={() => isPremium && setExpanded(expanded === idx ? null : idx)}
              isLast={idx === sorted.length - 1}
              isPremium={isPremium}
              isLocked={!isPremium && idx >= 2}
            />
          ))}
        </div>

        {/* ── Overlay lock per non-premium ─────────────────── */}
        {!isPremium && (
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col items-center
                       justify-end pb-4 pt-16"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, rgba(5,8,15,0.97) 50%)',
            }}
          >
            <div
              className="mx-4 w-full max-w-xs rounded-xs p-4 text-center"
              style={{
                background: 'rgba(0,102,255,0.06)',
                border: '1px solid rgba(0,102,255,0.2)',
                boxShadow: '0 0 24px rgba(0,102,255,0.1)',
              }}
            >
              <Lock size={18} className="mx-auto mb-2" style={{ color: '#0066ff' }} />
              <p className="font-mono text-xs font-bold mb-1" style={{ color: '#f0f4ff' }}>
                Abbiamo identificato potenziali esposizioni su account associati al dominio
              </p>
              <p className="font-mono text-[0.6rem] mb-3" style={{ color: '#8899bb' }}>
                Accedi a Domain Watch Premium per visualizzare dettagli completi, fonti dei breach e avviare il workflow di remediation.
              </p>
              <button
                onClick={onUpgrade}
                className="w-full flex items-center justify-center gap-2
                           font-mono text-xs font-bold tracking-[0.1em] uppercase
                           py-2.5 rounded-xs transition-all duration-200"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,102,255,0.9), rgba(0,60,200,0.9))',
                  border: '1px solid rgba(0,102,255,0.4)',
                  boxShadow: '0 0 14px rgba(0,102,255,0.3)',
                  color: '#fff',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 24px rgba(0,102,255,0.55)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 14px rgba(0,102,255,0.3)' }}
              >
                <Zap size={12} />
                Sblocca Domain Watch
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  )
}

// ── Sub-component: EmployeeRow ──────────────────────────────────
function EmployeeRow({ employee: emp, isExpanded, onToggle, isLast, isPremium, isLocked }) {
  const cfg = STATUS_CFG[emp.status]
  const Icon = cfg.icon

  return (
    <div
      className={clsx(!isLast && 'border-b', isLocked && 'opacity-40 select-none')}
      style={{ borderColor: 'rgba(0,102,255,0.06)' }}
    >
      {/* Riga principale */}
      <div
        className={clsx(
          'flex items-center gap-3 px-4 py-2.5 transition-colors duration-150',
          !isLocked && 'cursor-pointer hover:bg-white/[0.02]',
          isLocked && 'cursor-not-allowed',
        )}
        onClick={!isLocked ? onToggle : undefined}
      >
        {/* Avatar iniziali */}
        <div
          className="w-7 h-7 rounded-xs flex items-center justify-center flex-shrink-0
                     font-mono text-[0.6rem] font-bold"
          style={{
            background: emp.status === 'breached' ? 'rgba(255,68,68,0.1)' : 'rgba(0,255,136,0.08)',
            border: `1px solid ${cfg.color}25`,
            color: isLocked ? '#2a3550' : cfg.color,
          }}
        >
          {isLocked ? '??' : emp.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
        </div>

        {/* Nome + email */}
        <div className="flex-1 min-w-0">
          <div className="font-mono text-[0.7rem] font-medium truncate"
            style={{ color: isLocked ? '#2a3550' : '#f0f4ff' }}>
            {isLocked ? '████████ ████████' : emp.name}
          </div>
          <div className="font-mono text-[0.58rem] truncate" style={{ color: '#2a3550' }}>
            {isLocked ? '████████@' + emp.email.split('@')[1] : maskEmail(emp.email)}
          </div>
        </div>

        {/* Ruolo */}
        <span className="hidden sm:block font-mono text-[0.58rem] tracking-wide flex-shrink-0"
          style={{ color: '#2a3550' }}>
          {isLocked ? '████' : emp.role}
        </span>

        {/* Status badge */}
        <div
          className="flex items-center gap-1 px-1.5 py-0.5 rounded-xs flex-shrink-0"
          style={{
            background: isLocked ? 'rgba(42,53,80,0.3)' : cfg.bg,
            border: `1px solid ${isLocked ? 'rgba(42,53,80,0.4)' : cfg.border}`,
          }}
        >
          {isLocked
            ? <Lock size={9} style={{ color: '#2a3550' }} />
            : <Icon size={9} style={{ color: cfg.color }} />
          }
          <span className="font-mono text-[0.55rem] tracking-wider uppercase hidden sm:block"
            style={{ color: isLocked ? '#2a3550' : cfg.color }}>
            {isLocked ? 'BLOCCATO' : cfg.label}
          </span>
        </div>

        {/* Expand toggle */}
        {!isLocked && (
          <span style={{ color: '#445566' }}>
            {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </span>
        )}
      </div>

      {/* Riga espansa */}
      <div
        className={clsx(
          'overflow-hidden transition-all duration-250',
        )}
        style={{ maxHeight: isExpanded ? '120px' : '0px' }}
      >
        <div
          className="px-4 pb-3 pt-1 mx-4 mb-2 rounded-xs"
          style={{
            background: emp.status === 'breached' ? 'rgba(255,34,68,0.04)' : 'rgba(0,255,136,0.03)',
            border: `1px solid ${cfg.color}15`,
          }}
        >
          {emp.status === 'breached' ? (
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.57rem] uppercase tracking-widest"
                  style={{ color: '#445566' }}>Ultimo breach:</span>
                <span className="font-mono text-[0.6rem]" style={{ color: '#ff6666' }}>
                  {emp.lastBreach}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[0.57rem] uppercase tracking-widest"
                  style={{ color: '#445566' }}>Breach totali:</span>
                <span className="font-mono text-[0.6rem]" style={{ color: '#ff4444' }}>
                  {emp.breachCount} violazion{emp.breachCount === 1 ? 'e' : 'i'} rilevate
                </span>
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span
                  className="font-mono text-[0.57rem] px-2 py-0.5 rounded-xs"
                  style={{
                    color: '#ff4444',
                    background: 'rgba(255,34,68,0.08)',
                    border: '1px solid rgba(255,34,68,0.2)',
                  }}
                >
                  ⚠ Richiede password reset immediato
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ShieldCheck size={11} style={{ color: '#00ff88' }} />
              <span className="font-mono text-[0.6rem]" style={{ color: '#00cc6a' }}>
                Nessuna esposizione rilevata nei database monitorati.
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Sub-component: MiniStat ─────────────────────────────────────
function MiniStat({ label, value, color, icon, small = false }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-1.5 rounded-xs"
      style={{
        background: `${color}08`,
        border: `1px solid ${color}15`,
      }}
    >
      <div className="flex items-center gap-1" style={{ color }}>
        {icon}
        <span className={clsx('font-mono font-bold tabular-nums', small ? 'text-[0.6rem]' : 'text-sm')}>
          {value}
        </span>
      </div>
      <span className="font-mono text-[0.52rem] tracking-wide uppercase mt-0.5"
        style={{ color: '#445566' }}>
        {label}
      </span>
    </div>
  )
}

// ── Sub-component: SortBtn ──────────────────────────────────────
function SortBtn({ label, active, dir, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-0.5 font-mono text-[0.56rem] tracking-wide uppercase
                 transition-colors duration-150"
      style={{ color: active ? '#0066ff' : '#445566' }}
    >
      {label}
      {active && (dir === 'asc'
        ? <ChevronUp size={9} />
        : <ChevronDown size={9} />
      )}
    </button>
  )
}
