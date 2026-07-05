// ─────────────────────────────────────────────────────────────────
//  ORVEX — Backend Express
//
//  Ruolo: proxy tra il frontend React e l'API HaveIBeenPwned.
//  La chiave API rimane QUI (lato server) e non viene mai esposta
//  nel bundle JavaScript del browser.
//
//  Avvio:
//    node server/index.js          (produzione)
//    npm run server                (con nodemon in dev)
//
//  Porta: 3001 (il frontend Vite gira su 3000, vedi vite.config.js)
// ─────────────────────────────────────────────────────────────────

import express  from 'express'
import cors     from 'cors'
import dotenv   from 'dotenv'
import { fileURLToPath } from 'url'
import path     from 'path'

// Carica .env.local dalla root del progetto
const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

import breachRouter from './routes/breach.js'
import domainRouter from './routes/domain.js'
import { getFreeScanLimit, isFreeScanLimitEnabled } from './utils/freeScanLimit.js'

const app  = express()
const PORT = process.env.PORT || process.env.SERVER_PORT || 3001
const DIST_DIR = path.join(__dirname, '..', 'dist')

// ── Middleware ────────────────────────────────────────────────────
app.use(express.json())

// CORS: in dev accetta solo dal frontend Vite; in produzione
// sostituisci con il dominio reale (es. https://app.orvex.io)
const allowedOrigins = (process.env.CORS_ALLOW_ORIGINS || process.env.VITE_APP_URL || 'http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean)

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    return callback(new Error(`CORS origin not allowed: ${origin}`))
  },
  methods: ['GET', 'POST', 'OPTIONS'],
}))

// ── Routes ────────────────────────────────────────────────────────
app.use('/api/breach', breachRouter)
app.use('/api/domain', domainRouter)

// Health check (utile per monitoraggio uptime)
app.get('/api/health', (_req, res) => {
  res.json({
    status:    'ok',
    service:   'Orvex Backend',
    timestamp: new Date().toISOString(),
    hibp:      !!process.env.HIBP_API_KEY ? 'configured' : 'missing',
    domain_watch: 'enabled',
    anonymous_limit: isFreeScanLimitEnabled() ? 'enabled' : 'disabled',
    free_scan_limit: getFreeScanLimit(),
  })
})

// In produzione Render può servire frontend + API dallo stesso servizio.
app.use(express.static(DIST_DIR))
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next()
  res.sendFile(path.join(DIST_DIR, 'index.html'))
})

// ── 404 catch-all ─────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// ── Error handler ─────────────────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Orvex Server] Uncaught error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

// ── Start ─────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  🛡  Orvex Backend running on http://localhost:${PORT}`)
  console.log(`  🔑  HIBP API key: ${process.env.HIBP_API_KEY ? '✓ presente' : '✗ MANCANTE — imposta HIBP_API_KEY in .env.local'}`)
  console.log(`  🌐  CORS origin:  ${process.env.VITE_APP_URL || 'http://localhost:3000'}\n`)
})
