
import { createHmac } from 'node:crypto'
import ipaddr from 'ipaddr.js'

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

  const address = ipaddr.process(ip)
  // IPv6 privacy addresses within the same /64 must share one quota.
  const normalizedIp = address.kind() === 'ipv6'
    ? address.parts.slice(0, 4).map(part => part.toString(16)).join(':') + '::/64'
    : address.toString()

  const hash = createHmac('sha256', secret)
    .update(normalizedIp)
    .digest('hex')

  return `guest:${hash}`
}
