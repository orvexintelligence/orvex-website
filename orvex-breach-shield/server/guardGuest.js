
import { createHmac } from 'node:crypto'

// Crea un identificativo pseudonimo per gli ospiti.
// Non salva l'indirizzo IP originale nel database.
export function getGuardGuestKey(req) {
  const secret = process.env.GUARD_IP_HASH_SECRET

  if (!secret || secret.length < 32) {
    throw new Error('Segreto ospiti non configurato')
  }

  // Express interpreta req.ip in base alla
  // configurazione "trust proxy" del server.
  const ip = req.ip

  if (typeof ip !== 'string' || !ip) {
    throw new Error('Indirizzo IP ospite non disponibile')
  }

  const normalizedIp = ip.replace(/^::ffff:/, '')

  const hash = createHmac('sha256', secret)
    .update(normalizedIp)
    .digest('hex')

  return `guest:${hash}`
}
