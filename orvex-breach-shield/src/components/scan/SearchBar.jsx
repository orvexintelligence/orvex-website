import { useState, useRef, useCallback } from 'react'
import { Search, Mail, AlertCircle, ArrowRight, Loader2 } from 'lucide-react'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────────
//  SearchBar — Input email + pulsante "Verifica Vulnerabilità"
//
//  Props:
//    onScan(email)  → callback invocato al submit con l'email valida
//    isScanning     → bool, disabilita il form durante la scansione
// ─────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Suggerimenti di esempio per il placeholder rotante
const PLACEHOLDER_EXAMPLES = [
  'mario.rossi@azienda.com',
  'admin@tuaimpresa.it',
  'info@startup.io',
  'user@example.com',
]

export default function SearchBar({ onScan, isScanning = false }) {
  const [email, setEmail]           = useState('')
  const [error, setError]           = useState('')
  const [touched, setTouched]       = useState(false)
  const [focused, setFocused]       = useState(false)
  const [placeholderIdx]            = useState(() => Math.floor(Math.random() * PLACEHOLDER_EXAMPLES.length))
  const inputRef                    = useRef(null)

  // Validazione in tempo reale (solo dopo primo blur)
  const validate = useCallback((value) => {
    if (!value.trim())          return 'Inserisci un indirizzo email.'
    if (!EMAIL_REGEX.test(value)) return 'Formato email non valido.'
    return ''
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setEmail(val)
    if (touched) setError(validate(val))
  }

  const handleBlur = () => {
    setFocused(false)
    setTouched(true)
    setError(validate(email))
  }

  const handleSubmit = (e) => {
    e?.preventDefault()
    setTouched(true)
    const err = validate(email)
    if (err) {
      setError(err)
      inputRef.current?.focus()
      return
    }
    setError('')
    onScan(email.trim().toLowerCase())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSubmit()
  }

  const isValid    = email && !validate(email)
  const hasError   = touched && !!error
  const isDisabled = isScanning

  // Stile bordo dinamico
  const borderStyle = () => {
    if (isDisabled)    return 'rgba(68,85,102,0.4)'
    if (hasError)      return '#ff2244'
    if (focused)       return '#0066ff'
    if (isValid)       return 'rgba(0,255,136,0.5)'
    return 'rgba(0,102,255,0.25)'
  }

  const shadowStyle = () => {
    if (isDisabled)    return 'none'
    if (hasError)      return '0 0 12px rgba(255,34,68,0.4)'
    if (focused)       return '0 0 16px rgba(0,102,255,0.5), 0 0 32px rgba(0,102,255,0.15)'
    if (isValid)       return '0 0 8px rgba(0,255,136,0.2)'
    return 'none'
  }

  return (
    <div className="w-full max-w-2xl mx-auto">

      {/* ── Label / intestazione ──────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
        <span
          className="font-mono text-[0.6rem] tracking-[0.2em] uppercase"
          style={{ color: '#0066ff' }}
        >
          // INPUT TARGET
        </span>
        <div className="flex-1 h-px" style={{ background: 'rgba(0,102,255,0.15)' }} />
        <span className="font-mono text-[0.55rem] tracking-widest text-orvex-text-muted uppercase">
          Email o username
        </span>
      </div>

      {/* ── Form wrapper ──────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative"
      >
        {/* Input + Button container */}
        <div
          className="flex items-stretch gap-0 rounded-xs overflow-hidden transition-all duration-300"
          style={{
            border: `1px solid ${borderStyle()}`,
            boxShadow: shadowStyle(),
            background: 'rgba(8,12,20,0.95)',
          }}
        >
          {/* Icona mail a sinistra */}
          <div className="flex items-center px-3 border-r"
            style={{ borderColor: 'rgba(0,102,255,0.12)' }}
          >
            <Mail
              size={15}
              style={{
                color: hasError ? '#ff2244' : isValid ? '#00ff88' : focused ? '#0066ff' : '#445566',
                transition: 'color 0.2s ease',
                filter: focused && !hasError ? 'drop-shadow(0 0 4px rgba(0,102,255,0.8))' : 'none',
              }}
            />
          </div>

          {/* Input email */}
          <input
            ref={inputRef}
            type="email"
            inputMode="email"
            autoComplete="email"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck="false"
            value={email}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={() => setFocused(true)}
            onKeyDown={handleKeyDown}
            disabled={isDisabled}
            placeholder={PLACEHOLDER_EXAMPLES[placeholderIdx]}
            aria-label="Email da verificare"
            aria-describedby={hasError ? 'search-error' : undefined}
            aria-invalid={hasError}
            className={clsx(
              'flex-1 bg-transparent outline-none py-4 px-3',
              'font-mono text-sm text-orvex-text-primary',
              'placeholder:text-orvex-text-muted placeholder:font-mono',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'transition-colors duration-200',
            )}
            style={{ caretColor: '#00d4ff', minWidth: 0 }}
          />

          {/* Clear button (appare solo se c'è testo) */}
          {email && !isDisabled && (
            <button
              type="button"
              onClick={() => { setEmail(''); setError(''); setTouched(false); inputRef.current?.focus() }}
              className="px-2 text-orvex-text-muted hover:text-orvex-text-secondary transition-colors"
              aria-label="Cancella input"
            >
              <span className="font-mono text-xs">✕</span>
            </button>
          )}

          {/* Divider */}
          <div className="w-px self-stretch" style={{ background: 'rgba(0,102,255,0.12)' }} />

          {/* CTA Button */}
          <button
            type="submit"
            disabled={isDisabled}
            aria-label="Avvia scansione"
            className={clsx(
              'flex items-center gap-2 px-5 sm:px-6',
              'font-mono text-xs font-bold tracking-[0.14em] uppercase',
              'text-white transition-all duration-200',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              !isDisabled && 'hover:brightness-110 active:scale-95',
            )}
            style={{
              background: isDisabled
                ? 'rgba(0,60,120,0.3)'
                : 'linear-gradient(135deg, rgba(0,102,255,0.95) 0%, rgba(0,60,180,0.95) 100%)',
              boxShadow: !isDisabled ? '0 0 12px rgba(0,102,255,0.3)' : 'none',
              minWidth: '130px',
            }}
            onMouseEnter={e => {
              if (!isDisabled) e.currentTarget.style.boxShadow = '0 0 20px rgba(0,102,255,0.7)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.boxShadow = !isDisabled ? '0 0 12px rgba(0,102,255,0.3)' : 'none'
            }}
          >
            {isScanning ? (
              <>
                <Loader2 size={13} className="animate-spin flex-shrink-0" />
                <span className="hidden sm:inline">Scanning</span>
                <span className="sm:hidden">...</span>
              </>
            ) : (
              <>
                <Search size={13} className="flex-shrink-0" />
                <span className="hidden sm:inline">Verifica</span>
                <ArrowRight size={13} className="sm:hidden flex-shrink-0" />
              </>
            )}
          </button>
        </div>

        {/* ── Barra di progresso sottile (attiva solo durante scan) ── */}
        {isScanning && (
          <div
            className="absolute bottom-0 left-0 right-0 h-px overflow-hidden"
            style={{ background: 'rgba(0,102,255,0.1)' }}
          >
            <div
              className="h-full"
              style={{
                background: 'linear-gradient(90deg, #0066ff, #00d4ff, #0066ff)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 1.5s linear infinite',
                width: '100%',
              }}
            />
          </div>
        )}
      </form>

      {/* ── Messaggio di errore ──────────────────────────────── */}
      <div
        className={clsx(
          'flex items-center gap-1.5 mt-2 overflow-hidden transition-all duration-200',
          hasError ? 'max-h-8 opacity-100' : 'max-h-0 opacity-0'
        )}
        id="search-error"
        role="alert"
        aria-live="polite"
      >
        <AlertCircle size={11} style={{ color: '#ff2244', flexShrink: 0 }} />
        <span
          className="font-mono text-[0.65rem] tracking-wide"
          style={{ color: '#ff2244' }}
        >
          {error}
        </span>
      </div>

      {/* ── Hint info ────────────────────────────────────────── */}
      {!hasError && (
        <p className="mt-2 font-mono text-[0.6rem] tracking-wide text-orvex-text-muted text-center">
          La verifica è gratuita e anonima. Nessun dato viene archiviato.
        </p>
      )}

      {/* Keyframe shimmer inline */}
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  )
}
