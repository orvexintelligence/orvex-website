
import { createHmac } from 'node:crypto'

// Identificativo pseudonimo per i limiti giornalieri.
// Non memorizza l'indirizzo IP originale nel database.
export function getGuardGuestKey(req) {
  const secret = process.env.GUARD_IP_HASH_SECRET
  const ip = req.socket?.remoteAddress

  if (!secret || secret.length < 32 || !ip) {
    throw new Error('Identificazione ospite non configurata')
  }

  const normalizedIp = ip.replace(/^::ffff:/, '')

  const hash = createHmac('sha256', secret)
    .update(normalizedIp)
    .digest('hex')

  return `guest:${hash}`
}
