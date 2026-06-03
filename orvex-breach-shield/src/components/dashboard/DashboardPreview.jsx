import { useEffect, useRef, useState } from 'react'
import {
  X, Shield, Star, Lock, ChevronRight,
  Activity, Bell, Settings, Code2, Globe,
} from 'lucide-react'
import clsx from 'clsx'

import IdentityDashboard from './IdentityDashboard'
import DomainDashboard   from './DomainDashboard'
import ApiPortal         from './ApiPortal'
import { DASHBOARD_STATS } from '@data/breachDatabase'

// ─────────────────────────────────────────────────────────────────
//  DashboardPreview — Overlay modale che instrada verso la dashboard
//  corretta in base al piano attivo.
//
//  Props:
//    email      → string, email dell'utente
//    activePlan → 'identity' | 'domain' | 'api' | null
//    breaches   → array, risultato della scansione (per IdentityDashboard)
//    onClose()  → chiude la preview
// ─────────────────────────────────────────────────────────────────

const PLAN_META = {
  identity: {
    icon:     Shield,
    color:    '#0066ff',
    tag:      'PERSONALE',
    title:    'Identity Shield',
    tagColor: '#0066ff',
  },
  domain: {
    icon:     Globe,
    color:    '#00aaff',
    tag:      'AZIENDALE',
    title:    'Domain Watch',
    tagColor: '#00aaff',
  },
  api: {
    icon:     Code2,
    color:    '#7c3aed',
    tag:      'ENTERPRISE',
    title:    'API Integration',
    tagColor: '#7c3aed',
  },
}

export default function DashboardPreview({
  email = '',
  activePlan = null,
  breaches = [],
  isPremium = true,
  onClose,
  onUpgrade,
}) {
  const [visible,    setVisible]    = useState(false)
  const [panelReady, setPanelReady] = useState(false)
  const overlayRef = useRef(null)
  const panelRef   = useRef(null)

  const plan = PLAN_META[activePlan] || PLAN_META.identity
  const PlanIcon = plan.icon

  // Animazione apertura
  useEffect(() => {
    requestAnimationFrame(() => {
      setVisible(true)
      setTimeout(() => setPanelReady(true), 50)
    })
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Chiudi con ESC
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) handleClose()
  }

  const handleClose = () => {
    setVisible(false)
    setPanelReady(false)
    setTimeout(() => onClose?.(), 320)
  }

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={clsx(
        'fixed inset-0 z-50 flex items-start justify-center',
        'transition-all duration-300',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      style={{
        background: 'rgba(3,5,10,0.88)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        overflowY: 'auto',
        padding: '20px 12px 40px',
      }}
    >
      <div
        ref={panelRef}
        className={clsx(
          'w-full relative transition-all duration-350',
          panelReady ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.98]',
        )}
        style={{ maxWidth: '900px' }}
        onClick={e => e.stopPropagation()}
      >

        {/* ── Top accent bar — colore del piano ──────────────── */}
        <div
          className="h-0.5 rounded-t-xs"
          style={{
            background: `linear-gradient(90deg, ${plan.color} 0%, #00d4ff 40%, ${plan.color} 70%, #0066ff 100%)`,
            boxShadow: `0 0 12px ${plan.color}80`,
          }}
        />

        {/* ── Pannello principale ───────────────────────────── */}
        <div
          className="rounded-b-xs overflow-hidden"
          style={{
            background: 'rgba(6,9,18,0.98)',
            border: '1px solid rgba(0,102,255,0.18)',
            borderTop: 'none',
            boxShadow: '0 24px 80px rgba(0,0,0,0.9), 0 0 0 1px rgba(0,102,255,0.06)',
          }}
        >

          {/* ── Dashboard Header ────────────────────────────── */}
          <div
            className="flex items-center justify-between px-5 py-3.5 border-b"
            style={{
              borderColor: 'rgba(0,102,255,0.12)',
              background: 'rgba(5,8,15,0.6)',
            }}
          >
            {/* Logo + titolo */}
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xs flex items-center justify-center"
                style={{
                  background: `${plan.color}12`,
                  border: `1px solid ${plan.color}40`,
                  boxShadow: `0 0 10px ${plan.color}30`,
                }}
              >
                <PlanIcon size={15} style={{ color: plan.color, filter: `drop-shadow(0 0 4px ${plan.color}99)` }} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm tracking-[0.1em] uppercase"
                    style={{ color: '#f0f4ff' }}>
                    {plan.title}
                  </span>
                  {isPremium ? (
                    <>
                      <span
                        className="font-mono text-[0.55rem] tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
                        style={{
                          color: '#ffaa00',
                          background: 'rgba(255,170,0,0.1)',
                          border: '1px solid rgba(255,170,0,0.25)',
                        }}
                      >
                        PREMIUM
                      </span>
                      <span
                        className="font-mono text-[0.52rem] tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
                        style={{
                          color: '#00ff88',
                          background: 'rgba(0,255,136,0.08)',
                          border: '1px solid rgba(0,255,136,0.25)',
                        }}
                      >
                        ✓ ATTIVO
                      </span>
                    </>
                  ) : (
                    <span
                      className="font-mono text-[0.52rem] tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
                      style={{
                        color: '#8899bb',
                        background: 'rgba(136,153,187,0.06)',
                        border: '1px solid rgba(136,153,187,0.2)',
                      }}
                    >
                      FREE PREVIEW
                    </span>
                  )}
                  <span
                    className="font-mono text-[0.52rem] tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
                    style={{
                      color: plan.color,
                      background: `${plan.color}10`,
                      border: `1px solid ${plan.color}30`,
                    }}
                  >
                    {plan.tag}
                  </span>
                </div>
                <span className="font-mono text-[0.58rem]" style={{ color: '#445566' }}>
                  {email || 'utente@orvex.io'} · Ultima sync: {DASHBOARD_STATS.lastScan}
                </span>
              </div>
            </div>

            {/* Nav icons + close */}
            <div className="flex items-center gap-1">
              <NavIconBtn icon={<Activity size={14} />}  tooltip="Live feed" />
              <NavIconBtn icon={<Bell size={14} />}      tooltip="Alert" badge={DASHBOARD_STATS.criticalAlerts} />
              <NavIconBtn icon={<Settings size={14} />}  tooltip="Impostazioni" />
              <div className="w-px h-5 mx-1" style={{ background: 'rgba(0,102,255,0.15)' }} />
              <button
                onClick={handleClose}
                className="w-8 h-8 flex items-center justify-center rounded-xs
                           text-orvex-text-muted hover:text-orvex-text-primary
                           hover:bg-white/5 transition-all duration-150"
                title="Chiudi"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── Corpo: dashboard specifica del piano ────────── */}
          <div className="p-4 sm:p-5">
            {activePlan === 'identity' && (
              <IdentityDashboard
                email={email}
                breaches={breaches}
                onUpgrade={() => onUpgrade?.('identity') || handleClose()}
              />
            )}
            {activePlan === 'domain' && (
              <DomainDashboard
                email={email}
                isPremium={isPremium}
                onUpgrade={() => onUpgrade?.('domain') || handleClose()}
              />
            )}
            {activePlan === 'api' && (
              <ApiPortal email={email} />
            )}
            {!activePlan && (
              <IdentityDashboard
                email={email}
                breaches={breaches}
                onUpgrade={() => onUpgrade?.('identity') || handleClose()}
              />
            )}
          </div>

        </div>
      </div>
    </div>
  )
}

// ── Sub-component: NavIconBtn ────────────────────────────────────
function NavIconBtn({ icon, tooltip, badge }) {
  return (
    <button
      className="relative w-8 h-8 flex items-center justify-center rounded-xs
                 text-orvex-text-muted hover:text-orvex-text-secondary
                 hover:bg-white/5 transition-all duration-150"
      title={tooltip}
    >
      {icon}
      {badge > 0 && (
        <span
          className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full
                     flex items-center justify-center font-mono text-[0.45rem] font-bold"
          style={{
            background: '#ff2244',
            color: '#fff',
            boxShadow: '0 0 6px rgba(255,34,68,0.7)',
          }}
        >
          {badge}
        </span>
      )}
    </button>
  )
}
