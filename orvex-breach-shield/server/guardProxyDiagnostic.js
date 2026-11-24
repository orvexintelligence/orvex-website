import { createHmac, timingSafeEqual } from 'node:crypto'
import ipaddr from 'ipaddr.js'
import { getGuardGuestKey } from './guardGuest.js'

// Read-only diagnostic, authenticated with a short-lived, domain-separated HMAC.
// No raw IP addresses, credentials, user data or database access in the response.
export function guardProxyDiagnostic(req,res) {
  res.set('Cache-Control','no-store')
  const secret=process.env.GUARD_IP_HASH_SECRET
  const header=req.headers['x-guard-diagnostic']
  const match=typeof header==='string' && header.match(/^(\d{13}):([0-9a-f]{32}):([0-9a-f]{64})$/)
  if(!secret || secret.length<32 || !match || Math.abs(Date.now()-Number(match[1]))>60000) {
    return res.status(403).json({error:'Diagnostic access denied'})
  }
  const expected=createHmac('sha256',secret).update(`guard-proxy-diagnostic:v1:${match[1]}:${match[2]}`).digest()
  if(!timingSafeEqual(expected,Buffer.from(match[3],'hex'))) return res.status(403).json({error:'Diagnostic access denied'})
  try {
    const address=ipaddr.process(req.ip)
    return res.json({
      identity:getGuardGuestKey(req),ipFamily:address.kind(),ipRange:address.range(),
      interpretedHops:req.ips.length,trustProxy:req.app.get('trust proxy')===1?'one-hop':'disabled-or-custom',
      guestGateEnabled:process.env.GUARD_GUEST_IP_VERIFIED==='true'
    })
  } catch {return res.status(503).json({error:'Proxy identity unavailable'})}
}
