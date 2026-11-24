import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { GUARD_STRIPE_API_VERSION,GUARD_STRIPE_EVENTS } from '../server/guardStripeConfig.js'
test('Prepared Stripe endpoint exactly matches server API version and supported events',async()=>{
  const config=JSON.parse(await readFile(new URL('../ops/stripe-webhook.live.json',import.meta.url),'utf8'))
  assert.equal(config.api_version,GUARD_STRIPE_API_VERSION)
  assert.deepEqual(config.enabled_events,GUARD_STRIPE_EVENTS)
  assert.equal(config.connect,false)
  assert.equal(config.url,'https://orvex-guard-staging.onrender.com/api/guard/stripe/webhook')
  assert.equal('secret' in config,false)
})
test('Atomic bundle contains exact migration bodies and hashes, without nested transactions',async()=>{
  const bundle=await readFile(new URL('../ops/generated/apply.sql',import.meta.url),'utf8')
  for(const name of ['202611230001_direct_purchases.sql','202611230002_invoice_sync.sql']) {
    const source=(await readFile(new URL('../supabase/migrations/'+name,import.meta.url),'utf8')).replaceAll('\r\n','\n')
    assert.ok(bundle.includes(createHash('sha256').update(source).digest('hex')))
    assert.ok(bundle.replaceAll('\r\n','\n').includes(source.replace(/^begin;\s*$/im,'').replace(/^commit;\s*$/im,'')))
  }
  assert.equal((bundle.match(/^BEGIN;$/gim)??[]).length,1)
  assert.equal((bundle.match(/^COMMIT;$/gim)??[]).length,1)
  const preflight=(await readFile(new URL('../ops/preflight.sql',import.meta.url),'utf8')).replaceAll('\r\n','\n')
  assert.ok(bundle.replaceAll('\r\n','\n').includes(preflight))
})
