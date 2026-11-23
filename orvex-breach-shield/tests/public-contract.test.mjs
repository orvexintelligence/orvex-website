import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import vm from 'node:vm'
import { getGuardGuestKey } from '../server/guardGuest.js'

const html=readFileSync(new URL('../../orvex-guard.html',import.meta.url),'utf8').replaceAll('\r\n','\n')
test('Public markup and CSS match the live site audited on 2026-11-23',()=>{
  const markup=html.match(/^[\s\S]*?<script>/)[0]
  assert.equal(createHash('sha256').update(markup).digest('hex'),'74c68fd920f4daa7135465c5cb04e390fa142fb17882640423e8294d20f46636')
  assert.ok(html.includes("guestLimitTitle:'Registrati per continuare'"))
  assert.ok(html.includes('Piano FREE: 3 analisi/giorno'))
})
test('Paid buttons open the exact original Live links without authentication or fetch',()=>{
  const code=html.slice(html.indexOf('var STRIPE_LINKS='),html.indexOf('function toggleBilling()'))
  const opened=[]
  const context={window:{open:url=>opened.push(url)},isAnnual:false}
  vm.createContext(context);vm.runInContext(code,context)
  for(const plan of ['PREMIUM','SMALL B2B']) {
    for(const annual of [false,true]){context.isAnnual=annual;context.startGuardCheckout(plan)}
  }
  assert.deepEqual(opened,[
    'https://buy.stripe.com/5kQbJ1aZp7mO5pA8hybEA07','https://buy.stripe.com/8x2cN5ffFbD405gfK0bEA08',
    'https://buy.stripe.com/4gM9AT8Rh36y4lw41ibEA05','https://buy.stripe.com/dRm14nebB4aC5pAbtKbEA06'
  ])
})
test('Guest limits cannot be bypassed with IPv6 privacy addresses or mapped IPv4',()=>{
  const key=ip=>getGuardGuestKey({ip})
  assert.equal(key('192.0.2.1'),key('::ffff:192.0.2.1'))
  assert.equal(key('2001:db8:1:2::1'),key('2001:db8:1:2:aaaa:bbbb:cccc:dddd'))
  assert.notEqual(key('2001:db8:1:2::1'),key('2001:db8:1:3::1'))
  assert.throws(()=>key('not-an-ip'))
})
