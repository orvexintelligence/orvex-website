import { useState, useEffect } from 'react'
import { Shield, Activity, Lock, LogOut, User } from 'lucide-react'
import clsx from 'clsx'
import { useLanguage } from '@/lib/i18n'

export default function Header({ onPremiumClick, onNavigate, scanActive = false, user = null, onLogout }) {
  const [systemTime, setSystemTime] = useState('')
  const [systemOnline, setSystemOnline] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { lang, setLang } = useLanguage()

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const h = String(now.getHours()).padStart(2, '0')
      const m = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      setSystemTime(h + ':' + m + ':' + s)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const id = setTimeout(() => setSystemOnline(true), 800)
    return () => clearTimeout(id)
  }, [])

  return (
    <header
      className={clsx(
        'fixed top-0 left-0 right-0 z-40',
        'border-b border-orvex-border',
        'transition-opacity duration-300',
        scanActive && 'opacity-60 pointer-events-none'
      )}
      style={{
        background: 'rgba(5, 8, 15, 0.92)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="h-px w-full"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, #0066ff 30%, #00d4ff 50%, #0066ff 70%, transparent 100%)',
          boxShadow: '0 0 8px rgba(0,102,255,0.5)',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">

          {/* LEFT: Logo */}
          <div className="flex items-center gap-3">
            <div className="relative flex-shrink-0">
              <Shield
                size={22}
                className="text-orvex-cyan-500"
                style={{ filter: 'drop-shadow(0 0 6px rgba(0,102,255,0.8))' }}
              />
              <span
                className={clsx(
                  'absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full',
                  systemOnline ? 'bg-orvex-green-DEFAULT' : 'bg-orvex-amber',
                  systemOnline && 'animate-pulse'
                )}
                style={systemOnline ? { boxShadow: '0 0 6px rgba(0,255,136,0.8)' } : {}}
              />
            </div>
            <div className="flex flex-col leading-none gap-0.5">
              <div className="flex items-baseline gap-1.5">
                <span
                  className="font-mono font-bold text-sm tracking-[0.18em] text-orvex-text-primary uppercase"
                  style={{ textShadow: '0 0 12px rgba(0,102,255,0.4)' }}
                >
                  ORVEX
                </span>
                <span className="text-orvex-text-muted font-mono text-xs tracking-widest">//</span>
                <span className="font-mono font-medium text-xs tracking-[0.14em] text-orvex-cyan-500 uppercase">
                  INTEL
                </span>
              </div>
              <span className="font-mono text-[0.55rem] tracking-[0.2em] text-orvex-text-muted uppercase">
                Breach &amp; Identity Shield
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1 ml-2">
              <span
                className="font-mono text-[0.58rem] tracking-widest uppercase px-1.5 py-0.5 rounded-xs"
                style={{
                  color: '#0066ff',
                  background: 'rgba(0,102,255,0.08)',
                  border: '1px solid rgba(0,102,255,0.2)',
                }}
              >
                v1.0 MVP
              </span>
            </div>
          </div>

          {/* CENTER: Status */}
          <div className="hidden md:flex items-center gap-4">
            <StatusPill icon={<Activity size={10} />} label="DB ONLINE" active={systemOnline} activeColor="green" />
            <StatusPill icon={<Lock size={10} />} label="TLS 1.3" active={systemOnline} activeColor="cyan" />
            <span className="font-mono text-[0.6rem] tracking-widest text-orvex-text-muted tabular-nums">
              {systemTime || '--:--:--'}
            </span>
          </div>

          {/* RIGHT: Nav + CTA */}
          <div className="flex items-center gap-2">
            {/* Selettore Lingua */}
            <div className="hidden lg:flex items-center gap-1 mr-1">
              {['IT', 'EN'].map((l, i) => (
                <span key={l} className="flex items-center">
                  <button
                    onClick={() => setLang(l)}
                    className="font-mono text-[0.6rem] tracking-[0.18em] uppercase px-1.5 py-0.5 transition-all duration-150"
                    style={{
                      color: lang === l ? '#ffffff' : '#3a4a5e',
                      fontWeight: lang === l ? '700' : '400',
                      letterSpacing: '0.18em',
                    }}
                    onMouseEnter={e => { if (lang !== l) e.currentTarget.style.color = '#6a7a8e' }}
                    onMouseLeave={e => { if (lang !== l) e.currentTarget.style.color = '#3a4a5e' }}
                  >
                    {l === 'IT' ? 'ITA' : 'ENG'}
                  </button>
                  {i === 0 && (
                    <span className="font-mono text-[0.55rem]" style={{ color: '#2a3550', userSelect: 'none' }}>|</span>
                  )}
                </span>
              ))}
            </div>

            <nav className="hidden lg:flex items-center gap-1">
              <NavLink href="#scan"      onNavigate={onNavigate}>{lang === 'EN' ? 'Scanner' : 'Scanner'}</NavLink>
              <NavLink href="#solutions" onNavigate={onNavigate}>{lang === 'EN' ? 'Solutions' : 'Soluzioni'}</NavLink>
              <NavLink href="#about"     onNavigate={onNavigate}>{lang === 'EN' ? 'About' : 'Chi siamo'}</NavLink>
            </nav>

            {user && (
              <div className="flex items-center gap-2">
                <div
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xs cursor-default"
                  style={{ background: 'rgba(0,102,255,0.08)', border: '1px solid rgba(0,102,255,0.2)' }}
                >
                  <div
                    className="w-5 h-5 rounded-xs flex items-center justify-center flex-shrink-0 font-mono text-[0.55rem] font-bold"
                    style={{ background: 'rgba(0,102,255,0.2)', color: '#0066ff' }}
                  >
                    {(user.email && user.email[0]) ? user.email[0].toUpperCase() : <User size={10} />}
                  </div>
                  <span className="hidden sm:block font-mono text-[0.6rem] max-w-[120px] truncate" style={{ color: '#8899bb' }}>
                    {user.email}
                  </span>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1 font-mono text-[0.6rem] tracking-widest uppercase px-2.5 py-1.5 rounded-xs transition-all duration-150"
                  style={{ color: '#445566', border: '1px solid rgba(68,85,102,0.25)' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ff4444'; e.currentTarget.style.borderColor = 'rgba(255,68,68,0.3)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#445566'; e.currentTarget.style.borderColor = 'rgba(68,85,102,0.25)' }}
                >
                  <LogOut size={11} />
                  <span className="hidden sm:inline">Esci</span>
                </button>
              </div>
            )}

            <button
              className="lg:hidden p-1.5 text-orvex-text-secondary hover:text-orvex-text-primary transition-colors"
              onClick={() => setMobileMenuOpen(function(v) { return !v })}
              aria-label="Menu"
            >
              <div className="flex flex-col gap-1 w-4">
                <span className={clsx('h-px bg-current transition-all', mobileMenuOpen && 'rotate-45 translate-y-1.5')} />
                <span className={clsx('h-px bg-current transition-all', mobileMenuOpen && 'opacity-0')} />
                <span className={clsx('h-px bg-current transition-all', mobileMenuOpen && '-rotate-45 -translate-y-1.5')} />
              </div>
            </button>
          </div>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          className="lg:hidden border-t border-orvex-border px-4 py-3 flex flex-col gap-2"
          style={{ background: 'rgba(5,8,15,0.98)' }}
        >
          <MobileNavLink href="#scan"      onNavigate={onNavigate} onClick={function() { setMobileMenuOpen(false) }}>Scanner</MobileNavLink>
          <MobileNavLink href="#solutions" onNavigate={onNavigate} onClick={function() { setMobileMenuOpen(false) }}>Soluzioni</MobileNavLink>
          <MobileNavLink href="#about"     onNavigate={onNavigate} onClick={function() { setMobileMenuOpen(false) }}>Chi siamo</MobileNavLink>
        </div>
      )}
    </header>
  )
}

function scrollTo(href) {
  const id = href.replace('#', '')
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function NavLink(props) {
  const href = props.href
  const children = props.children
  const onNavigate = props.onNavigate
  const handleClick = function() {
    const sectionId = href.replace('#', '')
    if (onNavigate) onNavigate(sectionId)
    else scrollTo(href)
  }
  return (
    <button
      onClick={handleClick}
      className="font-mono text-xs tracking-widest uppercase text-orvex-text-secondary hover:text-orvex-text-primary px-3 py-1 rounded-xs transition-colors hover:bg-orvex-surface relative group"
    >
      {children}
      <span
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-px group-hover:w-4/5 transition-all duration-300"
        style={{ background: '#0066ff', boxShadow: '0 0 4px #0066ff' }}
      />
    </button>
  )
}

function MobileNavLink(props) {
  const href = props.href
  const children = props.children
  const onClick = props.onClick
  const onNavigate = props.onNavigate
  const handleClick = function() {
    if (onClick) onClick()
    const sectionId = href.replace('#', '')
    if (onNavigate) setTimeout(function() { onNavigate(sectionId) }, 100)
    else setTimeout(function() { scrollTo(href) }, 150)
  }
  return (
    <button
      onClick={handleClick}
      className="text-left font-mono text-xs tracking-widest uppercase text-orvex-text-secondary hover:text-orvex-text-primary py-2 px-2 rounded-xs hover:bg-orvex-surface transition-colors"
    >
      {children}
    </button>
  )
}

function StatusPill(props) {
  const icon = props.icon
  const label = props.label
  const active = props.active
  const activeColor = props.activeColor
  const colors = {
    green: { active: '#00ff88', bg: 'rgba(0,255,136,0.06)', border: 'rgba(0,255,136,0.15)' },
    cyan:  { active: '#00aaff', bg: 'rgba(0,170,255,0.06)', border: 'rgba(0,170,255,0.15)' },
  }
  const cfg = colors[activeColor] || colors.green
  return (
    <div
      className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-xs transition-all duration-500"
      style={{
        background: active ? cfg.bg : 'transparent',
        border: '1px solid ' + (active ? cfg.border : 'transparent'),
      }}
    >
      <span style={{ color: active ? cfg.active : '#2a3550' }}>{icon}</span>
      <span className="font-mono text-[0.56rem] tracking-widest uppercase" style={{ color: active ? cfg.active : '#2a3550' }}>
        {label}
      </span>
    </div>
  )
}