
// ─────────────────────────────────────────────────────────────────
// ORVEX — Backend Express
// ─────────────────────────────────────────────────────────────────

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

import breachRouter from './routes/breach.js'
import domainRouter from './routes/domain.js'
import guardRouter from './routes/guard.js'
import guardAnalyzeRouter from './routes/guardAnalyze.js'
import guardProfileRouter from './routes/guardProfile.js'
import guardCheckoutRouter from './routes/guardCheckout.js'
import { guardStripeWebhook } from './routes/guardStripeWebhook.js'
import { guardRateLimit } from './guardRateLimit.js'
import { getGuardAdmin } from './guardAdmin.js'
import { guardProxyDiagnostic } from './guardProxyDiagnostic.js'

export function createApp(deps = {}) {
const app = express()

// Configurazione proxy Render.
// Rimane disattivata fino alla verifica dei proxy.
if (process.env.GUARD_TRUST_PROXY === 'one-hop') {
  app.set('trust proxy', 1)
}

// WEBHOOK STRIPE
// Deve precedere express.json(), perché la verifica della firma
// richiede il corpo originale della richiesta.
app.post(
  '/api/guard/stripe/webhook',
  express.raw({
    type: 'application/json',
    limit: '256kb'
  }),
  deps.webhook ?? guardStripeWebhook
)

// CORS precede il parser, anche per le risposte JSON non valide.
app.use(cors({
  origin: [
    process.env.VITE_APP_URL || 'https://app.orvexintelligence.com',
    'https://orvexintelligence.com',
    'https://www.orvexintelligence.com',
    'http://localhost:8080'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
}))

app.get('/', (_req, res) => {
  res.json({
    status: 'online',
    service: 'Orvex Backend API',
    message: 'Backend attivo. Frontend servito da app.orvexintelligence.com',
    timestamp: new Date().toISOString(),
  })
})

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Orvex Backend',
    timestamp: new Date().toISOString(),
    hibp: process.env.HIBP_API_KEY ? 'configured' : 'missing',
  })
})

app.use(express.json({ limit: '16kb' }))

// Servizi Orvex già esistenti.
app.use('/api/breach', breachRouter)
app.use('/api/domain', domainRouter)

// Orvex Guard.
app.get('/api/guard/health', (_req, res) => res.json({
  status: 'ok', service: 'Orvex Guard API',
  nodeMajor: Number(process.versions.node.split('.')[0]),
  revision: process.env.RENDER_GIT_COMMIT || null
}))
app.get('/api/guard/diagnostics/proxy', guardProxyDiagnostic)
app.use('/api/guard', guardRateLimit(deps.getAdmin ?? getGuardAdmin))
app.use('/api/guard', deps.authRouter ?? guardRouter)
app.use('/api/guard/analyze', deps.analyzeRouter ?? guardAnalyzeRouter)
app.use('/api/guard/profile', guardProfileRouter)

// Orvex Guard — creazione link di pagamento autenticati.
app.use('/api/guard/checkout', guardCheckoutRouter)

// Gestione rotte inesistenti.
app.use((_req, res) => {
  res.status(404).json({
    error: 'Route not found'
  })
})

// Gestione errori.
app.use((err, _req, res, _next) => {
  console.error('[Orvex Server] Request failed:', err.type || err.name)
  const status = err.type === 'entity.too.large' ? 413 : err.type === 'entity.parse.failed' ? 400 : 503
  res.status(status).json({
    error: status === 413 ? 'Richiesta troppo grande' : status === 400 ? 'JSON non valido' : 'Servizio temporaneamente non disponibile'
  })
})

return app
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const PORT = process.env.PORT || process.env.SERVER_PORT || 3001
  createApp().listen(PORT, () => console.log(`Orvex Backend running on port ${PORT}`))
}
