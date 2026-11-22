
import { Router } from 'express'

const router = Router()

// Endpoint di prova per la migrazione Orvex Guard.
// Non accede ai database e non utilizza chiavi API.
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Orvex Guard API',
    environment: 'migration-test'
  })
})

export default router
