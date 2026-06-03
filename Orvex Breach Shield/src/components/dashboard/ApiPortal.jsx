import { useState, useCallback } from 'react'
import {
  Code2, Copy, CheckCircle2, Terminal, Zap,
  ChevronRight, Send, AlertCircle, Activity,
} from 'lucide-react'
import clsx from 'clsx'

// ─────────────────────────────────────────────────────────────────
//  ApiPortal — Developer Portal per il piano API Integration
//
//  Props:
//    email → string, email dell'utente (usata per generare la API key)
// ─────────────────────────────────────────────────────────────────

// FNV-1a 32-bit — genera una stringa esadecimale deterministica
function fnv1a(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h.toString(16).padStart(8, '0')
}

function generateApiKey(email) {
  const seed = email || 'user@orvex.io'
  const part1 = fnv1a(seed)
  const part2 = fnv1a(seed + '__2')
  const part3 = fnv1a(seed + '__3').slice(0, 6)
  return `orvex_sk_live_${part1}${part2}${part3}`
}

// ─────────────────────────────────────────────────────────────────

const CODE_EXAMPLES = {
  curl: (apiKey, email) =>
`curl -X POST https://api.orvex.io/v1/check \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"email": "${email || 'user@example.com'}"}'

# Response:
# {
#   "email": "${email || 'user@example.com'}",
#   "breached": true,
#   "breach_count": 3,
#   "risk_score": 78,
#   "breaches": [ ... ],
#   "last_seen": "2024-11-12T08:31:00Z"
# }`,

  python: (apiKey, email) =>
`import requests

ORVEX_API_KEY = "${apiKey}"

def check_email(email: str) -> dict:
    resp = requests.post(
        "https://api.orvex.io/v1/check",
        headers={"Authorization": f"Bearer {ORVEX_API_KEY}"},
        json={"email": email},
        timeout=5,
    )
    resp.raise_for_status()
    return resp.json()

# Esempio di utilizzo
result = check_email("${email || 'user@example.com'}")
print(f"Breached: {result['breached']}")
print(f"Risk score: {result['risk_score']}/100")
for breach in result.get("breaches", []):
    print(f"  - {breach['name']} ({breach['date']})")`,

  node: (apiKey, email) =>
`const ORVEX_API_KEY = '${apiKey}';

async function checkEmail(email) {
  const res = await fetch('https://api.orvex.io/v1/check', {
    method: 'POST',
    headers: {
      'Authorization': \`Bearer \${ORVEX_API_KEY}\`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) throw new Error(\`API error \${res.status}\`);
  return res.json();
}

// Esempio di utilizzo
checkEmail('${email || 'user@example.com'}').then(result => {
  console.log('Breached:', result.breached);
  console.log('Risk score:', result.risk_score);
  result.breaches?.forEach(b => console.log(' -', b.name));
});`,
}

// ─────────────────────────────────────────────────────────────────

const RATE_TIERS = [
  { label: 'Free',       value: '100 req/day',    color: '#445566', active: false },
  { label: 'Premium',    value: '10K req/day',     color: '#0066ff', active: false },
  { label: 'Enterprise', value: '10K req/min',     color: '#7c3aed', active: true  },
]

const ENDPOINT_LIST = [
  { method: 'POST', path: '/v1/check',         desc: 'Controlla singola email',           color: '#00aaff' },
  { method: 'POST', path: '/v1/check/bulk',    desc: 'Batch fino a 500 email per richiesta', color: '#00aaff' },
  { method: 'GET',  path: '/v1/breaches',      desc: 'Lista breach nel database',          color: '#00ff88' },
  { method: 'GET',  path: '/v1/domain/:domain',desc: 'Analisi dominio completa',            color: '#00ff88' },
  { method: 'POST', path: '/v1/webhooks',      desc: 'Registra webhook per alert real-time', color: '#ffaa00' },
]

export default function ApiPortal({ email = '' }) {
  const apiKey    = generateApiKey(email)
  const [lang,    setLang]    = useState('curl')
  const [copied,  setCopied]  = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [formData, setFormData] = useState({
    name: '', company: '', contactEmail: email, useCase: '', volume: '',
  })
  const [formSent, setFormSent]       = useState(false)
  const [formSending, setFormSending] = useState(false)
  const [formError, setFormError]     = useState(false)

  const codeSnippet = CODE_EXAMPLES[lang]?.(apiKey, email) ?? ''

  const handleCopyKey = useCallback(() => {
    navigator.clipboard?.writeText(apiKey).catch(() => {})
    setCopiedKey(true)
    setTimeout(() => setCopiedKey(false), 2000)
  }, [apiKey])

  const handleCopyCode = useCallback(() => {
    navigator.clipboard?.writeText(codeSnippet).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [codeSnippet])

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setFormSending(true)
    setFormError(false)
    try {
      const res = await fetch('https://formspree.io/f/xnjrrqga', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          name:    formData.name,
          company: formData.company,
          email:   formData.contactEmail,
          useCase: formData.useCase,
          volume:  formData.volume,
        }),
      })
      if (res.ok) {
        setFormSent(true)
      } else {
        setFormError(true)
      }
    } catch {
      setFormError(true)
    } finally {
      setFormSending(false)
    }
  }

  return (
    <div className="space-y-4">

      {/* ── Status bar ────────────────────────────────────────── */}
      <div
        className="flex flex-wrap items-center gap-3 sm:gap-5 px-4 py-2.5 rounded-xs"
        style={{
          background: 'rgba(8,12,20,0.6)',
          border: '1px solid rgba(124,58,237,0.12)',
        }}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: '#00ff88', boxShadow: '0 0 4px #00ff88' }} />
          <span className="font-mono text-[0.58rem]" style={{ color: '#445566' }}>API Status:</span>
          <span className="font-mono text-[0.58rem] font-bold" style={{ color: '#00ff88' }}>ONLINE</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Activity size={9} style={{ color: '#7c3aed' }} />
          <span className="font-mono text-[0.58rem]" style={{ color: '#445566' }}>Rate limit:</span>
          <span className="font-mono text-[0.58rem] font-bold" style={{ color: '#7c3aed' }}>10K req/min</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[0.58rem]" style={{ color: '#445566' }}>Latenza media:</span>
          <span className="font-mono text-[0.58rem] font-bold" style={{ color: '#00aaff' }}>38ms</span>
        </div>
        <div className="ml-auto">
          <span className="font-mono text-[0.57rem] tracking-widest" style={{ color: '#445566' }}>
            Uptime 99.9% · v2.1
          </span>
        </div>
      </div>

      {/* ── Grid: API Key + Rate Tiers ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* API Key */}
        <div
          className="lg:col-span-2 rounded-xs overflow-hidden"
          style={{
            background: 'rgba(5,8,15,0.9)',
            border: '1px solid rgba(124,58,237,0.18)',
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 border-b"
            style={{ borderColor: 'rgba(124,58,237,0.12)' }}
          >
            <Code2 size={12} style={{ color: '#7c3aed' }} />
            <span className="font-mono text-[0.63rem] tracking-[0.18em] uppercase"
              style={{ color: '#f0f4ff' }}>
              API Key
            </span>
            <span
              className="font-mono text-[0.53rem] tracking-widest uppercase px-1.5 py-0.5 rounded-xs ml-auto"
              style={{
                color: '#7c3aed',
                background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.25)',
              }}
            >
              LIVE
            </span>
          </div>

          <div className="p-4">
            <p className="font-mono text-[0.6rem] tracking-widest uppercase mb-2"
              style={{ color: '#445566' }}>
              La tua chiave segreta — non condividerla mai
            </p>

            <div
              className="flex items-center gap-2 p-3 rounded-xs group"
              style={{
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(124,58,237,0.2)',
              }}
            >
              <code
                className="font-mono text-xs flex-1 truncate"
                style={{ color: '#7c3aed', letterSpacing: '0.05em' }}
              >
                {apiKey}
              </code>
              <button
                onClick={handleCopyKey}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xs
                           font-mono text-[0.6rem] font-bold tracking-widest uppercase
                           transition-all duration-150"
                style={{
                  color: copiedKey ? '#00ff88' : '#7c3aed',
                  background: copiedKey ? 'rgba(0,255,136,0.1)' : 'rgba(124,58,237,0.1)',
                  border: `1px solid ${copiedKey ? 'rgba(0,255,136,0.3)' : 'rgba(124,58,237,0.3)'}`,
                }}
              >
                {copiedKey
                  ? <><CheckCircle2 size={11} />Copiata</>
                  : <><Copy size={11} />Copia</>
                }
              </button>
            </div>

            <p className="font-mono text-[0.58rem] mt-2 leading-relaxed"
              style={{ color: '#2a3545' }}>
              Tieni questa chiave privata. Usala nell'header HTTP{' '}
              <code style={{ color: '#445566' }}>Authorization: Bearer &lt;key&gt;</code>
            </p>
          </div>
        </div>

        {/* Rate tiers */}
        <div
          className="rounded-xs overflow-hidden"
          style={{
            background: 'rgba(5,8,15,0.9)',
            border: '1px solid rgba(124,58,237,0.18)',
          }}
        >
          <div
            className="flex items-center gap-2 px-4 py-3 border-b"
            style={{ borderColor: 'rgba(124,58,237,0.12)' }}
          >
            <Zap size={12} style={{ color: '#ffaa00' }} />
            <span className="font-mono text-[0.63rem] tracking-[0.18em] uppercase"
              style={{ color: '#f0f4ff' }}>
              Rate Limit
            </span>
          </div>
          <div className="p-4 space-y-2">
            {RATE_TIERS.map(tier => (
              <div
                key={tier.label}
                className="flex items-center justify-between p-2.5 rounded-xs"
                style={{
                  background: tier.active ? `${tier.color}08` : 'transparent',
                  border: `1px solid ${tier.active ? tier.color + '30' : 'rgba(0,102,255,0.06)'}`,
                }}
              >
                <div className="flex items-center gap-2">
                  {tier.active && (
                    <span className="w-1.5 h-1.5 rounded-full"
                      style={{ background: tier.color, boxShadow: `0 0 4px ${tier.color}` }} />
                  )}
                  <span
                    className="font-mono text-[0.63rem] font-bold"
                    style={{ color: tier.active ? tier.color : '#2a3545' }}
                  >
                    {tier.label}
                  </span>
                </div>
                <span
                  className="font-mono text-[0.6rem] tabular-nums"
                  style={{ color: tier.active ? tier.color : '#2a3545' }}
                >
                  {tier.value}
                </span>
              </div>
            ))}

            <p className="font-mono text-[0.57rem] pt-1 text-center"
              style={{ color: '#1a2535' }}>
              Piano Enterprise attivo
            </p>
          </div>
        </div>
      </div>

      {/* ── Terminale codice ──────────────────────────────────── */}
      <div
        className="rounded-xs overflow-hidden"
        style={{
          background: 'rgba(3,5,10,0.95)',
          border: '1px solid rgba(124,58,237,0.18)',
        }}
      >
        {/* Header terminale */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-b"
          style={{ borderColor: 'rgba(124,58,237,0.1)', background: 'rgba(5,8,15,0.6)' }}
        >
          <div className="flex items-center gap-3">
            <Terminal size={12} style={{ color: '#7c3aed' }} />
            <span className="font-mono text-[0.63rem] tracking-[0.18em] uppercase"
              style={{ color: '#f0f4ff' }}>
              Quick Start
            </span>
            {/* Fake dots */}
            <div className="flex gap-1 ml-1">
              {['#ff5f57', '#ffbd2e', '#28ca41'].map(c => (
                <span key={c} className="w-2.5 h-2.5 rounded-full"
                  style={{ background: c, opacity: 0.7 }} />
              ))}
            </div>
          </div>

          {/* Language tabs */}
          <div className="flex items-center gap-1">
            {['curl', 'python', 'node'].map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className="font-mono text-[0.58rem] tracking-widest uppercase px-2.5 py-1 rounded-xs
                           transition-all duration-150"
                style={{
                  color: lang === l ? '#7c3aed' : '#445566',
                  background: lang === l ? 'rgba(124,58,237,0.1)' : 'transparent',
                  border: `1px solid ${lang === l ? 'rgba(124,58,237,0.3)' : 'transparent'}`,
                }}
              >
                {l}
              </button>
            ))}
            <button
              onClick={handleCopyCode}
              className="ml-2 flex items-center gap-1 px-2.5 py-1 rounded-xs font-mono text-[0.58rem]
                         tracking-widest uppercase transition-all duration-150"
              style={{
                color: copied ? '#00ff88' : '#445566',
                background: copied ? 'rgba(0,255,136,0.08)' : 'transparent',
                border: `1px solid ${copied ? 'rgba(0,255,136,0.2)' : 'rgba(0,102,255,0.08)'}`,
              }}
            >
              {copied ? <CheckCircle2 size={10} /> : <Copy size={10} />}
              {copied ? 'Copiato' : 'Copia'}
            </button>
          </div>
        </div>

        {/* Code area */}
        <pre
          className="px-5 py-4 overflow-x-auto"
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '0.72rem',
            lineHeight: '1.7',
            color: '#8899bb',
            minHeight: '180px',
          }}
        >
          <code>{codeSnippet}</code>
        </pre>
      </div>

      {/* ── Endpoint disponibili ──────────────────────────────── */}
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
          <Activity size={12} style={{ color: '#0066ff' }} />
          <span className="font-mono text-[0.63rem] tracking-[0.18em] uppercase"
            style={{ color: '#f0f4ff' }}>
            Endpoint disponibili
          </span>
          <span className="font-mono text-[0.55rem] ml-auto" style={{ color: '#445566' }}>
            Base URL: api.orvex.io
          </span>
        </div>

        <div className="divide-y" style={{ '--tw-divide-opacity': 1 }}>
          {ENDPOINT_LIST.map((ep, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-2.5
                         hover:bg-white/[0.015] transition-colors duration-100"
            >
              <span
                className="font-mono text-[0.58rem] font-bold tracking-wide w-10 flex-shrink-0"
                style={{ color: ep.color }}
              >
                {ep.method}
              </span>
              <code
                className="font-mono text-xs flex-shrink-0"
                style={{ color: '#f0f4ff' }}
              >
                {ep.path}
              </code>
              <span className="font-mono text-[0.6rem] ml-2" style={{ color: '#445566' }}>
                — {ep.desc}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Form Enterprise ───────────────────────────────────── */}
      <EnterpriseForm
        formData={formData}
        onChange={setFormData}
        onSubmit={handleFormSubmit}
        sent={formSent}
        sending={formSending}
        error={formError}
      />
    </div>
  )
}

// ── Sub-component: EnterpriseForm ────────────────────────────────
function EnterpriseForm({ formData, onChange, onSubmit, sent, sending, error }) {
  const update = (field) => (e) =>
    onChange(prev => ({ ...prev, [field]: e.target.value }))

  if (sent) {
    return (
      <div
        className="rounded-xs p-6 text-center"
        style={{
          background: 'rgba(124,58,237,0.05)',
          border: '1px solid rgba(124,58,237,0.2)',
        }}
      >
        <CheckCircle2 size={28} className="mx-auto mb-3" style={{ color: '#7c3aed' }} />
        <p className="font-mono text-sm font-bold mb-1" style={{ color: '#7c3aed' }}>
          Richiesta Enterprise inviata
        </p>
        <p className="font-mono text-xs" style={{ color: '#8899bb' }}>
          Il team Orvex Enterprise ti contatterà entro 24h all'indirizzo{' '}
          <span style={{ color: '#f0f4ff' }}>{formData.contactEmail}</span>
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xs overflow-hidden"
      style={{
        background: 'rgba(5,8,15,0.9)',
        border: '1px solid rgba(124,58,237,0.18)',
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ borderColor: 'rgba(124,58,237,0.12)' }}
      >
        <Send size={12} style={{ color: '#7c3aed' }} />
        <span className="font-mono text-[0.63rem] tracking-[0.18em] uppercase"
          style={{ color: '#f0f4ff' }}>
          Contatta il Reparto Enterprise
        </span>
        <span
          className="ml-auto font-mono text-[0.55rem] tracking-widest uppercase px-2 py-0.5 rounded-xs"
          style={{
            color: '#7c3aed',
            background: 'rgba(124,58,237,0.08)',
            border: '1px solid rgba(124,58,237,0.2)',
          }}
        >
          Rate Limit Upgrade · SLA Dedicato
        </span>
      </div>

      <form onSubmit={onSubmit} className="p-4 space-y-3">
        <div className="flex items-start gap-2 p-3 rounded-xs mb-1"
          style={{
            background: 'rgba(124,58,237,0.04)',
            border: '1px solid rgba(124,58,237,0.12)',
          }}
        >
          <AlertCircle size={12} style={{ color: '#7c3aed', flexShrink: 0, marginTop: '1px' }} />
          <p className="font-mono text-[0.62rem] leading-relaxed" style={{ color: '#8899bb' }}>
            Hai bisogno di rate limit superiori a 10K req/min, di un SLA dedicato o
            di un'integrazione custom? Compila il form — un ingegnere Orvex ti contatterà entro 24h.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <FormField
            label="Nome e cognome"
            placeholder="Mario Rossi"
            value={formData.name}
            onChange={update('name')}
            required
          />
          <FormField
            label="Azienda"
            placeholder="Acme Corp S.p.A."
            value={formData.company}
            onChange={update('company')}
            required
          />
          <FormField
            label="Email di contatto"
            type="email"
            placeholder="mario@azienda.it"
            value={formData.contactEmail}
            onChange={update('contactEmail')}
            required
          />
          <div>
            <label className="font-mono text-[0.6rem] tracking-widest uppercase block mb-1.5"
              style={{ color: '#445566' }}>
              Volume richieste stimato
            </label>
            <select
              value={formData.volume}
              onChange={update('volume')}
              required
              className="w-full font-mono text-xs rounded-xs px-3 py-2.5 appearance-none"
              style={{
                background: 'rgba(8,12,20,0.8)',
                border: '1px solid rgba(124,58,237,0.2)',
                color: formData.volume ? '#f0f4ff' : '#445566',
                outline: 'none',
              }}
            >
              <option value="">Seleziona...</option>
              <option value="10k-100k">10K – 100K req/giorno</option>
              <option value="100k-1m">100K – 1M req/giorno</option>
              <option value="1m-10m">1M – 10M req/giorno</option>
              <option value="10m+">Oltre 10M req/giorno</option>
            </select>
          </div>
        </div>

        <div>
          <label className="font-mono text-[0.6rem] tracking-widest uppercase block mb-1.5"
            style={{ color: '#445566' }}>
            Caso d'uso / Integrazione richiesta
          </label>
          <textarea
            value={formData.useCase}
            onChange={update('useCase')}
            required
            rows={3}
            placeholder="Es: integrazione nel SIEM aziendale per correlazione breach in tempo reale su 50K utenti..."
            className="w-full font-mono text-xs rounded-xs px-3 py-2.5 resize-none"
            style={{
              background: 'rgba(8,12,20,0.8)',
              border: '1px solid rgba(124,58,237,0.2)',
              color: '#f0f4ff',
              outline: 'none',
            }}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xs"
            style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
            <AlertCircle size={12} style={{ color: '#ef4444', flexShrink: 0 }} />
            <p className="font-mono text-[0.62rem]" style={{ color: '#ef4444' }}>
              Errore durante l'invio. Controlla la connessione e riprova.
            </p>
          </div>
        )}

        <button
          type="submit"
          disabled={sending}
          className="w-full flex items-center justify-center gap-2
                     font-mono text-xs font-bold tracking-[0.1em] uppercase
                     text-white py-3.5 rounded-xs transition-all duration-200
                     disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, rgba(124,58,237,0.9), rgba(90,30,200,0.9))',
            border: '1px solid rgba(124,58,237,0.4)',
            boxShadow: '0 0 16px rgba(124,58,237,0.25)',
          }}
          onMouseEnter={e => { if (!sending) e.currentTarget.style.boxShadow = '0 0 28px rgba(124,58,237,0.5)' }}
          onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 16px rgba(124,58,237,0.25)' }}
        >
          {sending ? (
            <>
              <Activity size={13} className="animate-pulse" />
              Invio in corso...
            </>
          ) : (
            <>
              <Send size={13} />
              Invia richiesta Enterprise
              <ChevronRight size={13} />
            </>
          )}
        </button>
      </form>
    </div>
  )
}

// ── Sub-component: FormField ─────────────────────────────────────
function FormField({ label, placeholder, value, onChange, type = 'text', required }) {
  return (
    <div>
      <label className="font-mono text-[0.6rem] tracking-widest uppercase block mb-1.5"
        style={{ color: '#445566' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full font-mono text-xs rounded-xs px-3 py-2.5"
        style={{
          background: 'rgba(8,12,20,0.8)',
          border: '1px solid rgba(124,58,237,0.2)',
          color: '#f0f4ff',
          outline: 'none',
        }}
        onFocus={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.5)' }}
        onBlur={e => { e.currentTarget.style.borderColor = 'rgba(124,58,237,0.2)' }}
      />
    </div>
  )
}
