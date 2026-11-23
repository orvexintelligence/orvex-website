// Never load .env.guard.local: all external services in this suite are fake.
process.env.STRIPE_GUARD_MODE = 'live'
process.env.STRIPE_GUARD_PREMIUM_MONTHLY_PRICE_ID = 'price_1TfQR5EOeFY4IpjhH4Kl0wbF'
process.env.STRIPE_GUARD_PREMIUM_YEARLY_PRICE_ID = 'price_fixture_premium_year'
process.env.STRIPE_GUARD_SMALL_B2B_MONTHLY_PRICE_ID = 'price_fixture_b2b_month'
process.env.STRIPE_GUARD_SMALL_B2B_YEARLY_PRICE_ID = 'price_fixture_b2b_year'
process.env.GUARD_IP_HASH_SECRET = 'local-test-only-secret-not-used-in-production'
process.env.NODE_ENV = 'test'
process.env.GUARD_AI_ENABLED = 'true'
// Catch accidentally unmocked external HTTP calls.
const localFetch = globalThis.fetch
globalThis.fetch = (url, options) => {
  if (!['127.0.0.1','localhost'].includes(new URL(url).hostname)) throw new Error('External network forbidden in tests')
  return localFetch(url, options)
}
