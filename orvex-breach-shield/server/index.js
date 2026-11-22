
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

const app = express()
const PORT = process.env.PORT || process.env.SERVER_PORT || 3001

app.use(express.json())

app.use(cors({
  origin: process.env.VITE_APP_URL || 'https://app.orvexintelligence.com',
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

app.use('/api/breach', breachRouter)
app.use('/api/domain', domainRouter)
app.use('/api/guard', guardRouter)
app.use('/api/guard/analyze', guardAnalyzeRouter)

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

app.use((err, _req, res, _next) => {
  console.error('[Orvex Server] Uncaught error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Orvex Backend running on port ${PORT}`)
  console.log(`HIBP API key: ${process.env.HIBP_API_KEY ? 'presente' : 'MANCANTE'}`)
  console.log(`CORS origin: ${process.env.VITE_APP_URL || 'https://app.orvexintelligence.com'}`)
})
