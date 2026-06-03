import { useState } from 'react'
import {
  Shield, CheckCircle2, AlertTriangle, Lock, Key,
  Mail, Phone, CreditCard, User, Eye, Smartphone,
  ChevronDown, ChevronUp, ExternalLink, Clock,
} from 'lucide-react'
import clsx from 'clsx'
import ReportButton from './ReportButton'

// ─────────────────────────────────────────────────────────────────
//  IdentityDashboard — Dashboard personale Identity Shield
//
//  Props:
//    email     → string, email scansionata
//    breaches  → array, breach rilevati (da checkEmail)
// ─────────────────────────────────────────────────────────────────

// Mappa tipo-dato → icona + colore
const DATA_TYPE_META = {
  password:  { icon: Key,        color: '#ff4444', label: 'Password'         },
  email:     { icon: Mail,       color: '#0066ff', label: 'Email'             },
  phone:     { icon: Phone,      color: '#ffaa00', label: 'Telefono'          },
  credit_card:{ icon: CreditCard,color: '#ff4444', label: 'Carta di credito'  },
  name:      { icon: User,       color: '#00aaff', label: 'Nome e cognome'    },
  address:   { icon: Eye,        color: '#7c3aed', label: 'Indirizzo'         },
  username:  { icon: User,       color: '#00aaff', label: 'Username'          },
  dob:       { icon: Clock,      color: '#ffaa00', label: 'Data di nascita'   },
}

const SEVERITY_META = {
  critical: { color: '#ff2244', bg: 'rgba(255,34,68,0.08)',  border: 'rgba(255,34,68,0.25)',  label: 'CRITICO'  },
  high:     { color: '#ff6600', bg: 'rgba(255,102,0,0.08)', border: 'rgba(255,102,0,0.25)',  label: 'ALTO'     },
  medium:   { color: '#ffaa00', bg: 'rgba(255,170,0,0.06)', border: 'rgba(255,170,0,0.2)',   label: 'MEDIO'    },
}

// Checklist dinamica basata sui tipi di dati esposti
function buildChecklist(breaches = []) {
  const exposedTypes = new Set(breaches.flatMap(b => b.dataTypes || []))
  const items = []

  items.push({
    id: 'pwd', done: false, priority: 'high',
    title: 'Cambia le password esposte',
    desc: 'Aggiorna immediatamente le password degli account coinvolti. Usa una password unica per ciascun servizio.',
    icon: Key, color: '#ff4444',
  })
  items.push({
    id: '2fa', done: false, priority: 'high',
    title: 'Attiva l\'autenticazione a due fattori',
    desc: 'Abilita 2FA (autenticatore o SMS) su tutti gli account critici: email, banca, social.',
    icon: Smartphone, color: '#0066ff',
  })
  if (exposedTypes.has('email') || exposedTypes.has('username')) {
    items.push({
      id: 'phish', done: false, priority: 'medium',
      title: 'Attenzione alle email di phishing',
      desc: 'La tua email è esposta. Diffida di comunicazioni sospette che richiedono dati personali o click su link.',
      icon: Mail, color: '#ffaa00',
    })
  }
  if (exposedTypes.has('credit_card')) {
    items.push({
      id: 'card', done: false, priority: 'critical',
      title: 'Blocca e richiedi nuova carta',
      desc: 'Contatta immediatamente la tua banca per bloccare la carta coinvolta e richiederne una nuova.',
      icon: CreditCard, color: '#ff2244',
    })
  }
  items.push({
    id: 'pwdmgr', done: false, priority: 'medium',
    title: 'Usa un password manager',
    desc: 'Strumenti come Bitwarden o 1Password generano e memorizzano password uniche e complesse.',
    icon: Lock, color: '#7c3aed',
  })
  items.push({
    id: 'monitor', done: false, priority: 'low',
    title: 'Monitora i tuoi account bancari',
    desc: 'Controlla i movimenti per 30–60 giorni e attiva gli alert per operazioni insolite.',
    icon: Eye, color: '#00aaff',
  })

  return items
}

export default function IdentityDashboard({ email = '', breaches = [], onUpgrade }) {
  const [expandedIdx, setExpandedIdx] = useState(null)
  const [checkedItems, setCheckedItems] = useState({})

  const checklist = buildChecklist(breaches)
  const toggleCheck = (id) =>
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }))
  const doneCount = checklist.filter(it => checkedItems[it.id]).length

  const username = email.split('@')[0] || 'utente'

  return (
    <div className="space-y-4">

      {/* ── Riepilogo stato identità ──────────────────────────── */}
      <div
        className="rounded-xs p-4"
        style={{
          background: breaches.length
            ? 'rgba(255,34,68,0.05)'
            : 'rgba(0,255,136,0.04)',
          border: `1px solid ${breaches.length ? 'rgba(255,34,68,0.2)' : 'rgba(0,255,136,0.15)'}`,
        }}
      >
        <div className="flex items-start gap-3">
          {breaches.length
            ? <AlertTriangle size={20} style={{ color: '#ff2244', flexShrink: 0, marginTop: '2px' }} />
            : <CheckCircle2 size={20} style={{ color: '#00ff88', flexShrink: 0, marginTop: '2px' }} />
          }
          <div className="flex-1 min-w-0">
            <p className="font-mono text-sm font-bold mb-1"
              style={{ color: breaches.length ? '#ff2244' : '#00ff88' }}>
              {breaches.length
                ? `${breaches.length} breach rilevat${breaches.length === 1 ? 'o' : 'i'} per questo account`
                : 'Nessun breach rilevato per questo account'
              }
            </p>
            <p className="font-mono text-[0.63rem] leading-relaxed" style={{ color: '#8899bb' }}>
              Account monitorato: <span style={{ color: '#f0f4ff' }}>{email}</span>
            </p>
          </div>
          {/* Progresso checklist */}
          <div className="flex-shrink-0 text-right">
            <p className="font-mono text-lg font-bold tabular-nums"
              style={{ color: '#0066ff' }}>
              {doneCount}/{checklist.length}
            </p>
            <p className="font-mono text-[0.55rem] tracking-widest uppercase"
              style={{ color: '#445566' }}>
              fix completati
            </p>
          </div>
        </div>
      </div>

      {/* ── Grid: breach + checklist ──────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* ── Breach rilevati ────────────────────────────────── */}
        <div
          className="rounded-xs overflow-hidden"
          style={{
            background: 'rgba(5,8,15,0.9)',
            border: '1px solid rgba(0,102,255,0.12)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'rgba(0,102,255,0.1)' }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle size={12} style={{ color: '#ff4444' }} />
              <span className="font-mono text-[0.63rem] tracking-[0.18em] uppercase"
                style={{ color: '#f0f4ff' }}>
                Breach Rilevati
              </span>
            </div>
            <span
              className="font-mono text-[0.55rem] px-2 py-0.5 rounded-xs"
              style={{
                color: breaches.length ? '#ff4444' : '#00ff88',
                background: breaches.length ? 'rgba(255,68,68,0.08)' : 'rgba(0,255,136,0.06)',
                border: `1px solid ${breaches.length ? 'rgba(255,68,68,0.2)' : 'rgba(0,255,136,0.15)'}`,
              }}
            >
              {breaches.length} trovati
            </span>
          </div>

          <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
            {breaches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <CheckCircle2 size={32} style={{ color: 'rgba(0,255,136,0.3)' }} />
                <p className="font-mono text-xs" style={{ color: '#445566' }}>
                  Nessun breach rilevato
                </p>
              </div>
            ) : (
              breaches.map((breach, idx) => (
                <BreachCard
                  key={idx}
                  breach={breach}
                  isExpanded={expandedIdx === idx}
                  onToggle={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Checklist di sicurezza ─────────────────────────── */}
        <div
          className="rounded-xs overflow-hidden"
          style={{
            background: 'rgba(5,8,15,0.9)',
            border: '1px solid rgba(0,102,255,0.12)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'rgba(0,102,255,0.1)' }}
          >
            <div className="flex items-center gap-2">
              <Shield size={12} style={{ color: '#0066ff' }} />
              <span className="font-mono text-[0.63rem] tracking-[0.18em] uppercase"
                style={{ color: '#f0f4ff' }}>
                Piano di Remediation
              </span>
            </div>
            {/* Progress bar mini */}
            <div className="flex items-center gap-2">
              <div className="w-16 h-1 rounded-xs overflow-hidden"
                style={{ background: 'rgba(0,102,255,0.1)' }}>
                <div
                  className="h-full rounded-xs transition-all duration-500"
                  style={{
                    width: `${checklist.length ? (doneCount / checklist.length) * 100 : 0}%`,
                    background: 'linear-gradient(90deg, #0066ff, #00d4ff)',
                  }}
                />
              </div>
              <span className="font-mono text-[0.55rem] tabular-nums" style={{ color: '#0066ff' }}>
                {Math.round(checklist.length ? (doneCount / checklist.length) * 100 : 0)}%
              </span>
            </div>
          </div>

          <div className="p-3 space-y-2">
            {checklist.map(item => (
              <ChecklistItem
                key={item.id}
                item={item}
                checked={!!checkedItems[item.id]}
                onToggle={() => toggleCheck(item.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ── Profilo esposizione dati ──────────────────────────── */}
      {breaches.length > 0 && (
        <ExposureProfile breaches={breaches} username={username} />
      )}

      {/* ── Report PDF — visibile a tutti gli utenti Identity Shield ── */}
      <ReportButton email={email} isPaid={true} onUpgrade={onUpgrade} />
    </div>
  )
}

// ── Sub-component: BreachCard ────────────────────────────────────
function BreachCard({ breach, isExpanded, onToggle }) {
  const sev = SEVERITY_META[breach.severity] || SEVERITY_META.medium

  return (
    <div
      className="border-b last:border-0"
      style={{ borderColor: 'rgba(0,102,255,0.07)' }}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3 text-left
                   hover:bg-white/[0.02] transition-colors duration-150"
      >
        {/* Severity dot */}
        <span
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ background: sev.color, boxShadow: `0 0 6px ${sev.color}80` }}
        />
        <div className="flex-1 min-w-0">
          <p className="font-mono text-xs font-bold truncate" style={{ color: '#f0f4ff' }}>
            {breach.name}
          </p>
          <p className="font-mono text-[0.58rem]" style={{ color: '#445566' }}>
            {breach.date} · {breach.records?.toLocaleString('it-IT')} record
          </p>
        </div>
        <span
          className="font-mono text-[0.53rem] tracking-widest uppercase px-1.5 py-0.5 rounded-xs flex-shrink-0"
          style={{ color: sev.color, background: sev.bg, border: `1px solid ${sev.border}` }}
        >
          {sev.label}
        </span>
        {isExpanded
          ? <ChevronUp size={12} style={{ color: '#445566', flexShrink: 0 }} />
          : <ChevronDown size={12} style={{ color: '#445566', flexShrink: 0 }} />
        }
      </button>

      {isExpanded && (
        <div
          className="px-4 pb-4 pt-1 space-y-3"
          style={{ background: 'rgba(0,0,0,0.2)' }}
        >
          <p className="font-mono text-[0.65rem] leading-relaxed" style={{ color: '#8899bb' }}>
            {breach.description || 'Nessuna descrizione disponibile.'}
          </p>

          {/* Tipi di dati esposti */}
          {breach.dataTypes?.length > 0 && (
            <div>
              <p className="font-mono text-[0.58rem] tracking-widest uppercase mb-2"
                style={{ color: '#445566' }}>
                Dati esposti:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {breach.dataTypes.map((type, i) => {
                  const meta = DATA_TYPE_META[type] || { icon: Eye, color: '#445566', label: type }
                  const Icon = meta.icon
                  return (
                    <span
                      key={i}
                      className="flex items-center gap-1 font-mono text-[0.6rem] px-2 py-0.5 rounded-xs"
                      style={{
                        color: meta.color,
                        background: `${meta.color}10`,
                        border: `1px solid ${meta.color}25`,
                      }}
                    >
                      <Icon size={9} />
                      {meta.label}
                    </span>
                  )
                })}
              </div>
            </div>
          )}

          {/* Dati teaser (blurred) */}
          <div
            className="rounded-xs p-2.5"
            style={{
              background: 'rgba(8,12,20,0.6)',
              border: '1px solid rgba(255,34,68,0.1)',
            }}
          >
            <p className="font-mono text-[0.58rem] tracking-widest uppercase mb-1.5"
              style={{ color: '#445566' }}>
              Dati compromessi:
            </p>
            <p className="font-mono text-xs blur-[3px] select-none"
              style={{ color: '#8899bb' }}>
              {`${breach.name.toLowerCase().replace(/\s/g, '')}@example.com · P@ssw0rd_${Math.floor(Math.random() * 9999)} · 192.168.x.x`}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Sub-component: ChecklistItem ─────────────────────────────────
function ChecklistItem({ item, checked, onToggle }) {
  const Icon = item.icon
  const PRIORITY_COLOR = { critical: '#ff2244', high: '#ff6600', medium: '#ffaa00', low: '#445566' }
  const priColor = PRIORITY_COLOR[item.priority] || '#445566'

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-xs cursor-pointer transition-all duration-150"
      style={{
        background: checked ? 'rgba(0,255,136,0.04)' : 'rgba(0,102,255,0.03)',
        border: `1px solid ${checked ? 'rgba(0,255,136,0.15)' : 'rgba(0,102,255,0.08)'}`,
        opacity: checked ? 0.6 : 1,
      }}
      onClick={onToggle}
    >
      {/* Checkbox custom */}
      <div
        className="w-5 h-5 rounded-xs flex items-center justify-center flex-shrink-0 mt-0.5 transition-all duration-200"
        style={{
          background: checked ? 'rgba(0,255,136,0.15)' : 'rgba(0,0,0,0.3)',
          border: `1px solid ${checked ? 'rgba(0,255,136,0.4)' : 'rgba(0,102,255,0.2)'}`,
        }}
      >
        {checked && <CheckCircle2 size={11} style={{ color: '#00ff88' }} />}
      </div>

      {/* Icona tipo */}
      <div
        className="w-7 h-7 rounded-xs flex items-center justify-center flex-shrink-0"
        style={{
          background: `${item.color}10`,
          border: `1px solid ${item.color}20`,
        }}
      >
        <Icon size={13} style={{ color: item.color }} />
      </div>

      {/* Testo */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p
            className={clsx('font-mono text-xs font-bold', checked && 'line-through')}
            style={{ color: checked ? '#445566' : '#f0f4ff' }}
          >
            {item.title}
          </p>
          <span
            className="font-mono text-[0.5rem] tracking-widest uppercase px-1 py-0.5 rounded-xs flex-shrink-0"
            style={{
              color: priColor,
              background: `${priColor}10`,
              border: `1px solid ${priColor}20`,
            }}
          >
            {item.priority}
          </span>
        </div>
        <p className="font-mono text-[0.6rem] leading-relaxed"
          style={{ color: checked ? '#2a3545' : '#8899bb' }}>
          {item.desc}
        </p>
      </div>
    </div>
  )
}

// ── Sub-component: ExposureProfile ──────────────────────────────
function ExposureProfile({ breaches, username }) {
  // Aggrega tutti i tipi di dati esposti
  const exposure = {}
  breaches.forEach(b => {
    b.dataTypes?.forEach(type => {
      exposure[type] = (exposure[type] || 0) + 1
    })
  })
  const exposedTypes = Object.entries(exposure).sort((a, b) => b[1] - a[1])

  return (
    <div
      className="rounded-xs overflow-hidden"
      style={{
        background: 'rgba(5,8,15,0.9)',
        border: '1px solid rgba(0,102,255,0.12)',
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: 'rgba(0,102,255,0.1)' }}
      >
        <Eye size={12} style={{ color: '#7c3aed' }} />
        <span className="font-mono text-[0.63rem] tracking-[0.18em] uppercase"
          style={{ color: '#f0f4ff' }}>
          Profilo Esposizione Dati
        </span>
        <span className="font-mono text-[0.55rem] ml-auto" style={{ color: '#445566' }}>
          Account: {username}
        </span>
      </div>

      <div className="px-4 py-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {exposedTypes.slice(0, 8).map(([type, count]) => {
            const meta = DATA_TYPE_META[type] || { icon: Eye, color: '#445566', label: type }
            const Icon = meta.icon
            return (
              <div
                key={type}
                className="flex flex-col items-center py-3 rounded-xs"
                style={{
                  background: `${meta.color}06`,
                  border: `1px solid ${meta.color}18`,
                }}
              >
                <Icon size={14} style={{ color: meta.color, marginBottom: '6px' }} />
                <span className="font-mono font-bold text-sm tabular-nums"
                  style={{ color: meta.color }}>
                  {count}x
                </span>
                <span className="font-mono text-[0.55rem] tracking-wide text-center mt-0.5"
                  style={{ color: '#445566' }}>
                  {meta.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
