import { useState, useCallback, useEffect, useRef } from 'react'
import clsx from 'clsx'
import {
  Shield, Eye, Globe, Cpu, Lock, Zap,
  Radio, Database, Code2, ChevronRight,
  CheckCircle2, ArrowRight,
} from 'lucide-react'

// ── Layout
import ScanLines        from '@components/layout/ScanLines'
import Header           from '@components/layout/Header'

// ── Scan flow
import SearchBar        from '@components/scan/SearchBar'
import ScanAnimation    from '@components/scan/ScanAnimation'
import ResultSafe       from '@components/scan/ResultSafe'
import ResultBreached   from '@components/scan/ResultBreached'

// ── Dashboard
import DashboardPreview from '@components/dashboard/DashboardPreview'

// ── Pricing
import PricingModal     from '@components/pricing/PricingModal'

// ── Auth
import AuthModal        from '@components/auth/AuthModal'
import { supabase }     from '@/lib/supabase'
import { useLanguage }  from '@/lib/i18n'

// ── Data
import { checkEmailReal }               from '@data/breachDatabase'
import {
  STRIPE_SUCCESS_PARAM,
  PLAN_TYPES,
  getActivePlan,
  setActivePlan,
  clearLegacyStorage,
} from '@data/stripeConfig'

const PHASES = { IDLE: 'idle', SCANNING: 'scanning', RESULT: 'result' }

export default function App() {
  const [phase,         setPhase]         = useState(PHASES.IDLE)
  const [email,         setEmail]         = useState('')
  const [scanResult,    setScanResult]    = useState(null)
  const [showDashboard,      setShowDashboard]      = useState(false)
  const [showPricing,        setShowPricing]        = useState(false)
  const [showDomainPreview,  setShowDomainPreview]  = useState(false)
  const [contentKey,         setContentKey]         = useState(0)
  const [isTransiting,       setTransiting]         = useState(false)

  // ── Piano attivo — persiste in localStorage ───────────────────
  const [activePlan,  setActivePlanState]  = useState(() => getActivePlan())
  const [pendingPlan, setPendingPlan]      = useState(null)

  // ── Auth Supabase ──────────────────────────────────────────────
  const [user,      setUser]      = useState(null)
  const [showAuth,  setShowAuth]  = useState(false)

  const mainRef = useRef(null)

  // Ascolta i cambiamenti di sessione Supabase
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  // ── Al mount: pulisce chiavi stale del vecchio sistema isPaid ──
  useEffect(() => {
    clearLegacyStorage()
    const cleanPlan = getActivePlan()
    if (cleanPlan !== activePlan) {
      setActivePlanState(cleanPlan)
    }
  }, []) // eslint-disable-line

  // ── Controlla URL param ?paid=<planType> (success_url di Stripe) ─
  useEffect(() => {
    const params  = new URLSearchParams(window.location.search)
    const paidVal = params.get(STRIPE_SUCCESS_PARAM)
    if (paidVal && PLAN_TYPES.includes(paidVal)) {
      setActivePlan(paidVal)
      setActivePlanState(paidVal)
      window.history.replaceState({}, '', window.location.pathname)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setShowDashboard(true), 400)
    }
  }, []) // eslint-disable-line

  const handleScan = useCallback((inputEmail) => {
    if (isTransiting) return
    setEmail(inputEmail)
    transitionTo(PHASES.SCANNING)
  }, [isTransiting])

  const handleScanComplete = useCallback(async () => {
    try {
      const result = await checkEmailReal(email)
      if (result) {
        setScanResult(result)
      } else {
        setScanResult({ breached: false, breaches: [] })
      }
    } catch (err) {
      console.error("Errore durante la scansione:", err)
      setScanResult({ breached: false, breaches: [] })
    }
    transitionTo(PHASES.RESULT)
  }, [email])

  const handleReset = useCallback(() => {
    transitionTo(PHASES.IDLE, () => {
      setEmail('')
      setScanResult(null)
    })
  }, [])

  // ── Gate Premium ───────────────────────────────────────────────
  //    domain (sempre)  → domain entry screen prima, poi dashboard o free preview
  //    identity/api pagati → dashboard completa
  //    identity/api non pagati → PricingModal
  const handleOpenPremium = useCallback((planId) => {
    const resolvedPlan = planId && typeof planId === 'string' ? planId : 'identity'
    if (resolvedPlan === 'domain') {
      // Domain Watch: SEMPRE schermata inserimento dominio prima
      // isPremium viene determinato da activePlan dentro DashboardPreview
      setShowDomainPreview(true)
    } else if (activePlan === resolvedPlan) {
      setShowDashboard(true)
    } else {
      setPendingPlan(resolvedPlan)
      setShowPricing(true)
    }
  }, [activePlan])

  const handleUpgradeToPlan = useCallback((planId) => {
    setShowDomainPreview(false)
    setTimeout(() => {
      setPendingPlan(planId)
      setShowPricing(true)
    }, 300)
  }, [])

  const handleCloseDashboard    = useCallback(() => setShowDashboard(false), [])
  const handleCloseDomainPreview = useCallback(() => setShowDomainPreview(false), [])
  const handleClosePricing       = useCallback(() => {
    setShowPricing(false)
    setPendingPlan(null)
  }, [])

  const handleNavigate = useCallback((sectionId) => {
    setShowDashboard(false)
    setShowPricing(false)
    setPendingPlan(null)

    const scrollAfter = (delay) => {
      setTimeout(() => {
        const el = document.getElementById(sectionId)
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }, delay)
    }

    if (phase !== PHASES.IDLE) {
      transitionTo(PHASES.IDLE, () => {
        setEmail('')
        setScanResult(null)
      })
      scrollAfter(350)
    } else {
      scrollAfter(40)
    }
  }, [phase]) // eslint-disable-line

  const handlePaymentComplete = useCallback((planType) => {
    const plan = PLAN_TYPES.includes(planType) ? planType : 'identity'
    setActivePlan(plan)
    setActivePlanState(plan)
    setPendingPlan(null)
    setShowPricing(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setTimeout(() => setShowDashboard(true), 350)
  }, [])

  const transitionTo = (nextPhase, afterReset) => {
    setTransiting(true)
    setTimeout(() => {
      afterReset?.()
      setPhase(nextPhase)
      setContentKey(k => k + 1)
      setTimeout(() => setTransiting(false), 50)
    }, 200)
  }

  useEffect(() => {
    if (phase !== PHASES.IDLE) {
      mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [phase])

  return (
    <>
      <ScanLines intensity="medium" beam flicker />

      <Header
        onPremiumClick={() => user ? handleOpenPremium(activePlan || 'identity') : setShowAuth(true)}
        onNavigate={handleNavigate}
        scanActive={phase === PHASES.SCANNING}
        isPaid={!!activePlan}
        user={user}
        onLogout={async () => { await supabase.auth.signOut(); setUser(null) }}
        onOpenAuth={() => setShowAuth(true)}
      />

      <main
        ref={mainRef}
        className="relative min-h-screen flex flex-col"
        style={{ paddingTop: '56px' }}
      >
        <div
          className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-700"
          style={{
            background: scanResult?.breached
              ? 'radial-gradient(ellipse at 50% 30%, rgba(255,34,68,0.05) 0%, transparent 60%)'
              : 'radial-gradient(ellipse at 50% 30%, rgba(0,102,255,0.05) 0%, transparent 60%)',
          }}
        />

        <div
          key={contentKey}
          className={clsx(
            'relative z-10 flex-1 flex flex-col transition-opacity duration-200',
            isTransiting ? 'opacity-0' : 'opacity-100',
          )}
        >
          {phase === PHASES.IDLE && (
            <>
              <HeroSection onScan={handleScan} />
              <SolutionsSection onPremium={handleOpenPremium} activePlan={activePlan} />
              <AboutSection  />
            </>
          )}

          {phase === PHASES.SCANNING && (
            <CenteredSection>
              <ScanAnimation
                email={email}
                onComplete={handleScanComplete}
                duration={3800}
              />
            </CenteredSection>
          )}

          {phase === PHASES.RESULT && scanResult && (
            <CenteredSection>
              {scanResult.breached ? (
                <ResultBreached
                  email={email}
                  breaches={scanResult.breaches || []}
                  onReset={handleReset}
                  onPremium={handleOpenPremium}
                />
              ) : (
                <ResultSafe
                  email={email}
                  onReset={handleReset}
                  onPremium={handleOpenPremium}
                />
              )}
            </CenteredSection>
          )}
        </div>

        <AppFooter />
      </main>

      {showDashboard && (
        <DashboardPreview
          email={email}
          activePlan={activePlan}
          breaches={scanResult?.breaches || []}
          isPremium={true}
          onClose={handleCloseDashboard}
          onUpgrade={handleUpgradeToPlan}
        />
      )}

      {showDomainPreview && (
        <DashboardPreview
          email={email}
          activePlan="domain"
          breaches={[]}
          isPremium={activePlan === 'domain'}
          onClose={handleCloseDomainPreview}
          onUpgrade={handleUpgradeToPlan}
        />
      )}

      {showPricing && (
        <PricingModal
          planType={pendingPlan || 'identity'}
          onClose={handleClosePricing}
          onPaymentComplete={handlePaymentComplete}
        />
      )}

      {showAuth && (
        <AuthModal
          initialTab="register"
          onClose={() => setShowAuth(false)}
          onAuth={(u) => { setUser(u); setShowAuth(false) }}
        />
      )}
    </>
  )
}

// ── HeroSection
function HeroSection({ onScan }) {
  const { t } = useLanguage()
  return (
    <section
      id="scan"
      className="relative flex flex-col items-center justify-center px-4 py-16 sm:py-24 min-h-[calc(100vh-56px)]"
    >
      <CornerDecoration position="top-left"     />
      <CornerDecoration position="top-right"    />
      <CornerDecoration position="bottom-left"  />
      <CornerDecoration position="bottom-right" />

      <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-xs animate-fade-up"
          style={{
            background: 'rgba(0,102,255,0.06)',
            border: '1px solid rgba(0,102,255,0.18)',
          }}
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#00ff88', boxShadow: '0 0 6px rgba(0,255,136,0.8)' }} />
          <span className="font-mono text-[0.6rem] tracking-[0.22em] uppercase" style={{ color: '#0066ff' }}>
            {t('hero.systemStatus')}
          </span>
        </div>

        <div className="text-center animate-fade-up-d1">
          <h1
            className="font-mono font-extrabold text-3xl sm:text-4xl md:text-5xl tracking-[0.06em] uppercase leading-tight mb-3"
            style={{ color: '#f0f4ff', textShadow: '0 0 40px rgba(0,102,255,0.25)' }}
          >
            {t('hero.title')}
            <br />
            <span style={{ color: '#0066ff', textShadow: '0 0 20px rgba(0,102,255,0.6), 0 0 60px rgba(0,102,255,0.2)' }}>
              {t('hero.titleAccent')}
            </span>
          </h1>
          <p className="font-mono text-sm sm:text-base leading-relaxed max-w-lg mx-auto" style={{ color: '#8899bb' }}>
            {t('hero.subtitle')}
          </p>
        </div>

        <div className="w-full animate-fade-up-d2">
          <SearchBar onScan={onScan} />
        </div>

        <div className="flex flex-wrap justify-center gap-6 sm:gap-10 animate-fade-up-d3">
          {[
            { value: t('hero.stat1Value'), label: t('hero.stat1Label') },
            { value: t('hero.stat2Value'), label: t('hero.stat2Label') },
            { value: t('hero.stat3Value'), label: t('hero.stat3Label') },
          ].map(({ value, label }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span className="font-mono font-bold text-lg sm:text-xl tabular-nums"
                style={{ color: '#0066ff', textShadow: '0 0 10px rgba(0,102,255,0.4)' }}>
                {value}
              </span>
              <span className="font-mono text-[0.6rem] tracking-widest uppercase" style={{ color: '#445566' }}>
                {label}
              </span>
            </div>
          ))}
        </div>

        <div className="w-full h-px animate-fade-up-d4"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(0,102,255,0.2), transparent)' }} />

        <div className="flex flex-wrap justify-center gap-2 animate-fade-up-d4">
          {[t('hero.pill1'), t('hero.pill2'), t('hero.pill3'), t('hero.pill4')].map(pill => (
            <span key={pill}
              className="font-mono text-[0.62rem] tracking-widest px-2.5 py-1 rounded-xs"
              style={{
                color: '#445566',
                background: 'rgba(0,102,255,0.04)',
                border: '1px solid rgba(0,102,255,0.1)',
              }}>
              {pill}
            </span>
          ))}
        </div>

        <button
          onClick={() => document.getElementById('solutions')?.scrollIntoView({ behavior: 'smooth' })}
          className="flex flex-col items-center gap-1.5 animate-fade-up-d5 text-orvex-text-muted hover:text-orvex-text-secondary transition-colors"
          aria-label="Scopri le soluciones"
        >
          <span className="font-mono text-[0.58rem] tracking-widest uppercase">{t('hero.scrollCta')}</span>
          <ChevronRight size={14} className="rotate-90 animate-bounce" />
        </button>
      </div>
    </section>
  )
}

// ── SolutionsSection
const SOLUTIONS = [
  {
    id:       'identity',
    icon:     Shield,
    accentColor: '#0066ff',
    glowColor:   'rgba(0,102,255,0.15)',
    borderColor: 'rgba(0,102,255,0.25)',
    tag:      'PERSONALE',
    title:    'Identity Shield',
    subtitle: 'Protezione identità digitale',
    desc:     'Monitora la tua email e le tue credenziali in tempo reale. Ricevi un alert immediato non appena i tuoi dati compaiono in un nuovo data breach o nel dark web.',
    features: [
      'Scansione su 47B+ record',
      'Alert breach in tempo reale',
      'Storico esposizioni completo',
      'Report PDF personale mensile',
    ],
    cta: 'Attiva Identity Shield',
  },
  {
    id:       'domain',
    icon:     Globe,
    accentColor: '#00aaff',
    glowColor:   'rgba(0,170,255,0.12)',
    borderColor: 'rgba(0,170,255,0.25)',
    tag:      'AZIENDALE',
    title:    'Domain Watch',
    subtitle: 'Protezione completa del dominio',
    desc:     "Monitora tutti i dipendenti della tua azienda da un'unica dashboard. Identifica le email compromesse prima che diventino un vettore di attacco.",
    features: [
      'Monitoraggio illimitato utenti',
      'Domain Health Score live',
      'Alert per dipendente esposto',
      'Integrazione con Active Directory',
    ],
    cta:      'Attiva Domain Watch',
    highlight: true,
  },
  {
    id:       'api',
    icon:     Code2,
    accentColor: '#7c3aed',
    glowColor:   'rgba(124,58,237,0.12)',
    borderColor: 'rgba(124,58,237,0.25)',
    tag:      'ENTERPRISE',
    title:    'API Integration',
    subtitle: 'Integrazione nei tuoi sistemi',
    desc:     "Accedi all'intero potere del motore Orvex via REST API. Integra il breach detection nel tuo SIEM, nei tuoi workflow CI/CD o nei sistemi IAM.",
    features: [
      'REST API con rate 10K req/min',
      'Webhook per alert real-time',
      'SDK per Python, Node, Go',
      'SLA 99.9% uptime garantito',
    ],
    cta: 'Richiedi accesso API',
  },
]

function SolutionsSection({ onPremium, activePlan }) {
  const { t } = useLanguage()
  return (
    <section id="solutions" className="relative px-4 py-16 max-w-6xl mx-auto w-full">
      <div className="text-center mb-12">
        <SectionTag color="#0066ff">{t('solutions.sectionTag')}</SectionTag>
        <h2 className="font-mono font-extrabold text-2xl sm:text-3xl tracking-[0.06em] uppercase mt-4 mb-2 text-white">
          {t('solutions.title')} <span style={{ color: '#0066ff' }}>{t('solutions.titleAccent')}</span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {SOLUTIONS.map((sol, i) => (
          <SolutionCard
            key={sol.id}
            sol={sol}
            delay={i * 100}
            isActive={activePlan === sol.id}
            onCta={() => onPremium(sol.id)}
          />
        ))}
      </div>
    </section>
  )
}

function SolutionCard({ sol, delay, onCta, isActive, t: tProp }) {
  const { t: tCtx } = useLanguage()
  const t = tProp || tCtx
  const Icon = sol.icon
  const ac = sol.accentColor
  return (
    <div
      className={clsx(
        'relative rounded-xs overflow-hidden flex flex-col',
        'transition-all duration-300 group animate-fade-up',
        sol.highlight && 'md:-translate-y-2',
      )}
      style={{
        animationDelay: `${delay}ms`,
        background: 'linear-gradient(160deg, rgba(8,12,22,0.98) 0%, rgba(5,8,15,0.99) 100%)',
        border:     isActive ? `1px solid ${ac}60` : `1px solid ${sol.borderColor}`,
        boxShadow:  isActive ? `0 4px 24px rgba(0,0,0,0.6), 0 0 20px ${ac}20` : '0 4px 24px rgba(0,0,0,0.6)',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.boxShadow = `0 8px 40px rgba(0,0,0,0.7), 0 0 30px ${sol.glowColor}`
        e.currentTarget.style.transform = sol.highlight ? 'translateY(-6px)' : 'translateY(-3px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.6)'
        e.currentTarget.style.transform = sol.highlight ? 'translateY(-8px)' : 'translateY(0)'
      }}
    >
      <div className="h-0.5 w-full"
        style={{ background: `linear-gradient(90deg, transparent, ${ac}, transparent)`, boxShadow: `0 0 8px ${ac}60` }} />
      <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
        {isActive && (
          <span className="font-mono text-[0.55rem] tracking-widest uppercase px-2 py-0.5 rounded-xs"
            style={{ color: '#00ff88', background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
            {t('solutions.activeBadge')}
          </span>
        )}
        {sol.highlight && !isActive && (
          <span className="font-mono text-[0.55rem] tracking-widest uppercase px-2 py-0.5 rounded-xs"
            style={{ color: ac, background: `${ac}15`, border: `1px solid ${ac}40` }}>
            {t('solutions.popularBadge')}
          </span>
        )}
      </div>
      <div className="flex flex-col flex-1 p-6">
        <div className="flex items-start gap-3 mb-5">
          <div className="w-11 h-11 rounded-xs flex items-center justify-center flex-shrink-0"
            style={{ background: `${ac}10`, border: `1px solid ${ac}30`, boxShadow: `0 0 12px ${ac}20` }}>
            <Icon size={20} style={{ color: ac }} />
          </div>
          <div>
            <span className="font-mono text-[0.55rem] tracking-[0.22em] uppercase" style={{ color: ac, opacity: 0.8 }}>
              {t(`solutions.${sol.id}_tag`)}
            </span>
            <h3 className="font-mono font-bold text-base tracking-wide" style={{ color: '#f0f4ff' }}>{t(`solutions.${sol.id}_title`)}</h3>
            <p className="font-mono text-[0.63rem]" style={{ color: '#445566' }}>{t(`solutions.${sol.id}_subtitle`)}</p>
          </div>
        </div>
        <div className="h-px mb-4" style={{ background: `linear-gradient(90deg, ${ac}20, transparent)` }} />
        <p className="font-mono text-xs leading-relaxed mb-5" style={{ color: '#8899bb' }}>{t(`solutions.${sol.id}_desc`)}</p>
        <ul className="space-y-2 mb-6 flex-1">
          {[1,2,3,4].map(n => (
            <li key={n} className="flex items-center gap-2">
              <CheckCircle2 size={11} style={{ color: ac, flexShrink: 0 }} />
              <span className="font-mono text-[0.65rem]" style={{ color: '#8899bb' }}>{t(`solutions.${sol.id}_f${n}`)}</span>
            </li>
          ))}
        </ul>
        <button
          onClick={onCta}
          className="w-full flex items-center justify-center gap-2 font-mono text-xs font-bold tracking-[0.1em] uppercase text-white py-3 rounded-xs transition-all duration-200 mt-auto"
          style={{
            background: isActive ? 'linear-gradient(135deg, rgba(0,200,100,0.8), rgba(0,150,70,0.8))' : `linear-gradient(135deg, ${ac}cc, ${ac}88)`,
            border:     isActive ? '1px solid rgba(0,255,136,0.35)' : `1px solid ${ac}50`,
            boxShadow:  isActive ? '0 0 12px rgba(0,255,136,0.2)' : `0 0 12px ${ac}25`,
          }}
          onMouseEnter={e => { e.currentTarget.style.boxShadow = isActive ? '0 0 22px rgba(0,255,136,0.4)' : `0 0 22px ${ac}55` }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = isActive ? '0 0 12px rgba(0,255,136,0.2)' : `0 0 12px ${ac}25` }}
        >
          {isActive ? t('solutions.openDashboard') : t(`solutions.${sol.id}_cta`)}
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

// ── AboutSection
const TECH_PILLAR_META = [
  { icon: Cpu,      color: '#0066ff', titleKey: 'about.pillar1Title', descKey: 'about.pillar1Desc' },
  { icon: Radio,    color: '#00aaff', titleKey: 'about.pillar2Title', descKey: 'about.pillar2Desc' },
  { icon: Database, color: '#7c3aed', titleKey: 'about.pillar3Title', descKey: 'about.pillar3Desc' },
  { icon: Eye,      color: '#00ff88', titleKey: 'about.pillar4Title', descKey: 'about.pillar4Desc' },
]

function CompanyStats() {
  const { t } = useLanguage()
  const stats = [
    { value: '2019',  label: t('about.stat1Label'), color: '#0066ff' },
    { value: '47B+',  label: t('about.stat2Label'), color: '#0066ff' },
    { value: '99.9%', label: t('about.stat3Label'), color: '#00ff88' },
    { value: '< 4s',  label: t('about.stat4Label'), color: '#00aaff' },
    { value: '180+',  label: t('about.stat5Label'), color: '#7c3aed' },
    { value: '12K+',  label: t('about.stat6Label'), color: '#ffaa00' },
  ]
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-16 rounded-xs p-5"
      style={{ background: 'rgba(8,12,20,0.7)', border: '1px solid rgba(0,102,255,0.1)' }}>
      {stats.map(({ value, label, color }) => (
        <div key={label} className="flex flex-col items-center gap-1 py-1">
          <span className="font-mono font-bold text-lg sm:text-xl tabular-nums"
            style={{ color, textShadow: `0 0 10px ${color}50` }}>{value}</span>
          <span className="font-mono text-[0.55rem] tracking-wide text-center uppercase"
            style={{ color: '#445566' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}

function AboutSection() {
  const { t } = useLanguage()
  return (
    <section id="about" className="relative px-4 py-20 sm:py-28">
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0,102,255,0.025) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0,102,255,0.025) 1px, transparent 1px)
          `,
          backgroundSize: '64px 64px',
        }} />
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(0,102,255,0.03) 0%, transparent 70%)',
        }} />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <SectionTag color="#00aaff">{t('about.sectionTag')}</SectionTag>
          <h2 className="font-mono font-extrabold text-2xl sm:text-3xl md:text-4xl tracking-[0.06em] uppercase mt-4 mb-3"
            style={{ color: '#f0f4ff', textShadow: '0 0 30px rgba(0,102,255,0.15)' }}>
            {t('about.title')}<br />
            <span style={{ color: '#00aaff' }}>{t('about.titleAccent')}</span>
          </h2>
          <p className="font-mono text-sm max-w-2xl mx-auto leading-relaxed" style={{ color: '#8899bb' }}>
            {t('about.intro')}
          </p>
        </div>

        <CompanyStats />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {TECH_PILLAR_META.map((pillar, i) => {
            const Icon = pillar.icon
            return (
              <div
                key={i}
                className="flex gap-4 p-5 rounded-xs group transition-all duration-300"
                style={{
                  background: 'rgba(8,12,20,0.7)',
                  border: `1px solid rgba(0,102,255,0.1)`,
                  boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.border = `1px solid ${pillar.color}30`
                  e.currentTarget.style.boxShadow = `0 4px 20px rgba(0,0,0,0.5), 0 0 20px ${pillar.color}10`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.border = '1px solid rgba(0,102,255,0.1)'
                  e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.4)'
                }}
              >
                <div className="flex-shrink-0 mt-0.5">
                  <div
                    className="w-10 h-10 rounded-xs flex items-center justify-center"
                    style={{
                      background: `${pillar.color}10`,
                      border: `1px solid ${pillar.color}25`,
                    }}
                  >
                    <Icon size={18} style={{ color: pillar.color }} />
                  </div>
                </div>

                <div>
                  <h3 className="font-mono font-bold text-sm tracking-wide mb-2" style={{ color: '#f0f4ff' }}>
                    {t(pillar.titleKey)}
                  </h3>
                  <p className="font-mono text-xs leading-relaxed" style={{ color: '#8899bb' }}>
                    {t(pillar.descKey)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div
          className="mt-12 p-6 sm:p-8 rounded-xs text-center"
          style={{
            background: 'rgba(0,102,255,0.03)',
            border: '1px solid rgba(0,102,255,0.12)',
          }}
        >
          <Zap size={20} className="mx-auto mb-3" style={{ color: '#0066ff' }} />
          <blockquote className="font-mono text-sm sm:text-base leading-relaxed max-w-2xl mx-auto" style={{ color: '#8899bb' }}>
            {t('footer.manifesto').split(t('footer.manifestoEmph1'))[0]}
            <em style={{ color: '#f0f4ff' }}>{t('footer.manifestoEmph1')}</em>
            {t('footer.manifesto').split(t('footer.manifestoEmph1'))[1]?.split(t('footer.manifestoEmph2'))[0]}
            <em style={{ color: '#f0f4ff' }}>{t('footer.manifestoEmph2')}</em>
            {t('footer.manifesto').split(t('footer.manifestoEmph2'))[1]}
          </blockquote>
          <p className="font-mono text-[0.62rem] tracking-widest uppercase mt-4" style={{ color: '#445566' }}>
            — {t('footer.manifestoSignature')}
          </p>
        </div>
      </div>
    </section>
  )
}

// ── Componenti condivisi
function CenteredSection({ children }) {
  return (
    <section className="flex-1 flex flex-col items-center justify-center px-4 py-10 sm:py-14">
      <div className="w-full max-w-2xl">{children}</div>
    </section>
  )
}

function SectionTag({ children, color }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <div className="flex-1 max-w-[80px] h-px" style={{ background: `linear-gradient(90deg, transparent, ${color}40)` }} />
      <span className="font-mono text-[0.6rem] tracking-[0.22em] uppercase" style={{ color: color }}>
        {children}
      </span>
      <div className="flex-1 max-w-[80px] h-px" style={{ background: `linear-gradient(90deg, ${color}40, transparent)` }} />
    </div>
  )
}

function AppFooter() {
  const { t } = useLanguage()
  return (
    <footer className="relative z-10 border-t px-6 py-5" style={{ borderColor: 'rgba(0,102,255,0.08)' }}>
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Shield size={12} style={{ color: 'rgba(0,102,255,0.3)' }} />
          <span className="font-mono text-[0.58rem] tracking-widest" style={{ color: '#1a2535' }}>
            {t('footer.copyright').replace('{year}', String(new Date().getFullYear()))}
          </span>
        </div>
      </div>
    </footer>
  )
}

const CORNER_STYLES = {
  'top-left':     { top: '72px',    left:   '16px', borderWidth: '1px 0 0 1px' },
  'top-right':    { top: '72px',    right:  '16px', borderWidth: '1px 1px 0 0' },
  'bottom-left':  { bottom: '48px', left:   '16px', borderWidth: '0 0 1px 1px' },
  'bottom-right': { bottom: '48px', right:  '16px', borderWidth: '0 1px 1px 0' },
}

// eslint-disable-next-line
function CornerDecoration({ position }) {
  return (
    <div
      className="fixed pointer-events-none hidden lg:block"
      style={{
        ...CORNER_STYLES[position],
        width: '32px',
        height: '32px',
        borderColor: 'rgba(0,102,255,0.2)',
        borderStyle: 'solid',
      }}
    />
  )
}