import { useState, useEffect, useRef } from 'react'
import {
  X, UserPlus, LogIn, Mail, Lock, Eye, EyeOff,
  CheckCircle2, AlertCircle, Loader2, Shield,
} from 'lucide-react'
import clsx from 'clsx'
import { supabase } from '@/lib/supabase'
import { useLanguage } from '@/lib/i18n'

// ─────────────────────────────────────────────────────────────────
//  AuthModal — Registrazione / Login via Supabase Auth
//
//  Props:
//    initialTab  → 'register' | 'login'  (default 'register')
//    onClose()   → chiude la modale
//    onAuth(user) → callback dopo autenticazione riuscita
// ─────────────────────────────────────────────────────────────────

export default function AuthModal({ initialTab = 'register', onClose, onAuth }) {
  const { t } = useLanguage()
  const [tab,        setTab]        = useState(initialTab)
  const [email,      setEmail]      = useState('')
  const [password,   setPassword]   = useState('')
  const [confirm,    setConfirm]    = useState('')
  const [showPwd,    setShowPwd]    = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [error,      setError]      = useState(null)
  const [success,    setSuccess]    = useState(null)
  const [visible,    setVisible]    = useState(false)
  const [panelReady, setPanelReady] = useState(false)
  const overlayRef = useRef(null)

  // Animazione apertura
  useEffect(() => {
    requestAnimationFrame(() => {
      setVisible(true)
      setTimeout(() => setPanelReady(true), 40)
    })
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // ESC per chiudere
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, []) // eslint-disable-line

  const handleClose = () => {
    setVisible(false)
    setPanelReady(false)
    setTimeout(() => onClose?.(), 280)
  }

  const resetForm = () => {
    setError(null)
    setSuccess(null)
  }

  const switchTab = (tabId) => {
    setTab(tabId)
    setPassword('')
    setConfirm('')
    resetForm()
  }

  // ── Registrazione ───────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault()
    resetForm()

    if (password !== confirm) {
      setError(t('auth.passwordMismatch') || 'Le password non corrispondono.')
      return
    }
    if (password.length < 8) {
      setError(t('auth.passwordShort') || 'La password deve essere di almeno 8 caratteri.')
      return
    }

    setLoading(true)
    const { data, error: err } = await supabase.auth.signUp({ email, password })
    setLoading(false)

    if (err) {
      setError(translateError(err.message))
      return
    }

    // Supabase invia una email di conferma — avvisiamo l'utente
    if (data?.user && !data.session) {
      setSuccess(t('auth.confirmEmail'))
    } else if (data?.session) {
      onAuth?.(data.user)
      handleClose()
    }
  }

  // ── Login ───────────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault()
    resetForm()
    setLoading(true)

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)

    if (err) {
      setError(translateError(err.message))
      return
    }

    onAuth?.(data.user)
    handleClose()
  }

  const isRegister = tab === 'register'

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) handleClose() }}
      className={clsx(
        'fixed inset-0 z-[70] flex items-center justify-center px-4',
        'transition-all duration-280',
        visible ? 'opacity-100' : 'opacity-0',
      )}
      style={{ background: 'rgba(2,4,10,0.92)', backdropFilter: 'blur(14px)' }}
    >
      <div
        className={clsx(
          'w-full transition-all duration-320',
          panelReady
            ? 'opacity-100 translate-y-0 scale-100'
            : 'opacity-0 translate-y-5 scale-[0.97]',
        )}
        style={{ maxWidth: '420px' }}
        onClick={e => e.stopPropagation()}
      >
        {/* ── Accent top ─────────────────────────────────────── */}
        <div
          className="h-0.5 rounded-t-xs"
          style={{
            background: 'linear-gradient(90deg, #0066ff 0%, #00d4ff 50%, #7c3aed 100%)',
            boxShadow: '0 0 14px rgba(0,102,255,0.5)',
          }}
        />

        <div
          className="rounded-b-xs overflow-hidden"
          style={{
            background: 'rgba(6,9,18,0.99)',
            border: '1px solid rgba(0,102,255,0.18)',
            borderTop: 'none',
            boxShadow: '0 32px 100px rgba(0,0,0,0.9)',
          }}
        >
          {/* ── Header ────────────────────────────────────────── */}
          <div
            className="flex items-center justify-between px-6 py-4 border-b"
            style={{ borderColor: 'rgba(0,102,255,0.1)', background: 'rgba(5,8,15,0.7)' }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-xs flex items-center justify-center"
                style={{
                  background: 'rgba(0,102,255,0.1)',
                  border: '1px solid rgba(0,102,255,0.3)',
                  boxShadow: '0 0 10px rgba(0,102,255,0.2)',
                }}
              >
                <Shield size={15} style={{ color: '#0066ff' }} />
              </div>
              <div>
                <span className="font-mono font-bold text-sm tracking-[0.1em] uppercase"
                  style={{ color: '#f0f4ff' }}>
                  Orvex Account
                </span>
                <p className="font-mono text-[0.58rem]" style={{ color: '#445566' }}>
                  Proteggi la tua identità digitale
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-xs
                         text-orvex-text-muted hover:text-orvex-text-primary
                         hover:bg-white/5 transition-all duration-150"
            >
              <X size={15} />
            </button>
          </div>

          {/* ── Tab switcher ──────────────────────────────────── */}
          <div
            className="flex border-b"
            style={{ borderColor: 'rgba(0,102,255,0.1)' }}
          >
            {[
              { id: 'register', label: t('auth.register'), icon: UserPlus },
              { id: 'login',    label: t('auth.login'),    icon: LogIn    },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => switchTab(id)}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 py-3',
                  'font-mono text-[0.65rem] tracking-widest uppercase',
                  'border-b-2 transition-all duration-150',
                )}
                style={{
                  borderBottomColor: tab === id ? '#0066ff' : 'transparent',
                  color: tab === id ? '#0066ff' : '#445566',
                  background: tab === id ? 'rgba(0,102,255,0.04)' : 'transparent',
                }}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
          </div>

          {/* ── Form ──────────────────────────────────────────── */}
          <div className="px-6 py-6">
            <form onSubmit={isRegister ? handleRegister : handleLogin} className="space-y-4">

              {/* Email */}
              <AuthField
                label="Email"
                type="email"
                placeholder="mario@azienda.it"
                value={email}
                onChange={e => setEmail(e.target.value)}
                icon={<Mail size={13} />}
                required
              />

              {/* Password */}
              <div>
                <label className="font-mono text-[0.6rem] tracking-widest uppercase block mb-1.5"
                  style={{ color: '#445566' }}>
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: '#445566' }}>
                    <Lock size={13} />
                  </div>
                  <input
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={isRegister ? 'Min. 8 caratteri' : '••••••••'}
                    required
                    className="w-full font-mono text-xs rounded-xs pl-9 pr-10 py-2.5"
                    style={{
                      background: 'rgba(8,12,20,0.8)',
                      border: '1px solid rgba(0,102,255,0.2)',
                      color: '#f0f4ff',
                      outline: 'none',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                    style={{ color: '#445566' }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#0066ff' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#445566' }}
                  >
                    {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>
                </div>
              </div>

              {/* Conferma password (solo registrazione) */}
              {isRegister && (
                <AuthField
                  label="Conferma password"
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Ripeti la password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  icon={<Lock size={13} />}
                  required
                />
              )}

              {/* Errore */}
              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xs"
                  style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.22)' }}>
                  <AlertCircle size={12} style={{ color: '#ef4444', flexShrink: 0, marginTop: '1px' }} />
                  <p className="font-mono text-[0.62rem] leading-relaxed" style={{ color: '#ef4444' }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Successo */}
              {success && (
                <div className="flex items-start gap-2 px-3 py-2.5 rounded-xs"
                  style={{ background: 'rgba(0,255,136,0.05)', border: '1px solid rgba(0,255,136,0.2)' }}>
                  <CheckCircle2 size={12} style={{ color: '#00ff88', flexShrink: 0, marginTop: '1px' }} />
                  <p className="font-mono text-[0.62rem] leading-relaxed" style={{ color: '#00cc6a' }}>
                    {success}
                  </p>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading || !!success}
                className="w-full flex items-center justify-center gap-2
                           font-mono text-xs font-bold tracking-[0.1em] uppercase
                           text-white py-3.5 rounded-xs transition-all duration-200
                           disabled:opacity-60 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,102,255,0.9), rgba(0,60,200,0.9))',
                  border: '1px solid rgba(0,102,255,0.4)',
                  boxShadow: '0 0 16px rgba(0,102,255,0.25)',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = '0 0 28px rgba(0,102,255,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(0,102,255,0.25)' }}
              >
                {loading ? (
                  <><Loader2 size={13} className="animate-spin" /> {t('auth.loading')}</>
                ) : isRegister ? (
                  <><UserPlus size={13} /> {t('auth.createBtn')}</>
                ) : (
                  <><LogIn size={13} /> {t('auth.loginBtn')}</>
                )}
              </button>

              {/* Switch tab link */}
              <p className="text-center font-mono text-[0.6rem]" style={{ color: '#445566' }}>
                {isRegister ? t('auth.hasAccount') : t('auth.noAccount')}{' '}
                <button
                  type="button"
                  onClick={() => switchTab(isRegister ? 'login' : 'register')}
                  className="transition-colors duration-150"
                  style={{ color: '#0066ff' }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#00aaff' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#0066ff' }}
                >
                  {isRegister ? t('auth.login') : t('auth.register')}
                </button>
              </p>

            </form>
          </div>

          {/* ── Footer ────────────────────────────────────────── */}
          <div
            className="px-6 py-3 border-t flex items-center justify-center gap-2"
            style={{ borderColor: 'rgba(0,102,255,0.08)', background: 'rgba(5,8,15,0.4)' }}
          >
            <Shield size={9} style={{ color: '#2a3550' }} />
            <span className="font-mono text-[0.55rem] tracking-wide" style={{ color: '#2a3550' }}>
              {t('auth.footerText')}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Sub-component: AuthField ────────────────────────────────────
function AuthField({ label, type, placeholder, value, onChange, icon, required }) {
  return (
    <div>
      <label className="font-mono text-[0.6rem] tracking-widest uppercase block mb-1.5"
        style={{ color: '#445566' }}>
        {label}
      </label>
      <div className="relative">
        <div className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: '#445566' }}>
          {icon}
        </div>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          className="w-full font-mono text-xs rounded-xs pl-9 pr-3 py-2.5"
          style={{
            background: 'rgba(8,12,20,0.8)',
            border: '1px solid rgba(0,102,255,0.2)',
            color: '#f0f4ff',
            outline: 'none',
          }}
        />
      </div>
    </div>
  )
}

// ── Traduzione errori Supabase → italiano ───────────────────────
function translateError(msg) {
  if (!msg) return 'Errore sconosciuto. Riprova.'
  const m = msg.toLowerCase()
  if (m.includes('invalid login') || m.includes('invalid credentials'))
    return 'Email o password non corretti.'
  if (m.includes('email already') || m.includes('already registered'))
    return 'Questa email è già registrata. Prova ad accedere.'
  if (m.includes('password should be'))
    return t('auth.passwordShort') || 'La password deve essere di almeno 8 caratteri.'
  if (m.includes('rate limit') || m.includes('too many'))
    return 'Troppi tentativi. Aspetta qualche minuto e riprova.'
  if (m.includes('network') || m.includes('fetch'))
    return 'Errore di connessione. Controlla internet e riprova.'
  if (m.includes('email not confirmed'))
    return 'Email non confermata. Controlla la tua casella di posta.'
  return msg
}
