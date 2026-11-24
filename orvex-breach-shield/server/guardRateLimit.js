import { getGuardGuestKey } from './guardGuest.js'

// Shared atomic counters, also across Render workers/restarts. Fail closed.
export function guardRateLimit(getAdmin, limit = 30) {
  return async (req, res, next) => {
    if (req.method === 'OPTIONS') return next()
    try {
      if (process.env.NODE_ENV === 'production' && process.env.GUARD_GUEST_IP_VERIFIED !== 'true') {
        return res.status(503).json({ error: 'Protezione richieste non configurata' })
      }
      const key = getGuardGuestKey(req)
      const { data, error } = await getAdmin().rpc('guard_take_request', {
        p_key: key, p_limit: limit
      })
      if (error || typeof data !== 'boolean') return res.status(503).json({ error: 'Protezione richieste non disponibile' })
      if (!data) {
        res.set('Retry-After', '60')
        return res.status(429).json({ error: 'Troppe richieste. Riprova tra un minuto.' })
      }
      next()
    } catch {
      return res.status(503).json({ error: 'Protezione richieste non disponibile' })
    }
  }
}
