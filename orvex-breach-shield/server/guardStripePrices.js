
const LIVE_GUARD_PRICES = [
  {
    env: 'STRIPE_GUARD_PREMIUM_MONTHLY_PRICE_ID',
    plan: 'premium',
    interval: 'month'
  },
  {
    env: 'STRIPE_GUARD_PREMIUM_YEARLY_PRICE_ID',
    plan: 'premium',
    interval: 'year'
  },
  {
    env: 'STRIPE_GUARD_SMALL_B2B_MONTHLY_PRICE_ID',
    plan: 'small_b2b',
    interval: 'month'
  },
  {
    env: 'STRIPE_GUARD_SMALL_B2B_YEARLY_PRICE_ID',
    plan: 'small_b2b',
    interval: 'year'
  }
]

const TEST_GUARD_PRICES = [
  {
    priceId: 'price_1UehhlCm02DXEmv1gaYfVI1a',
    plan: 'premium',
    interval: 'month'
  }
]

export function getGuardStripeMode() {
  const mode = process.env.STRIPE_GUARD_MODE ?? 'live'

  if (mode !== 'live' && mode !== 'test') {
    throw new Error('STRIPE_GUARD_MODE non valido')
  }

  return mode
}

export function getGuardPlanFromPrice(priceId) {
  if (typeof priceId !== 'string' || !priceId) {
    return null
  }

  const mode = getGuardStripeMode()

  const prices = mode === 'test'
    ? TEST_GUARD_PRICES
    : LIVE_GUARD_PRICES.map(item => ({
        priceId: process.env[item.env]?.trim(),
        plan: item.plan,
        interval: item.interval
      }))

  const match = prices.find(item => item.priceId === priceId)

  if (!match) return null

  return {
    plan: match.plan,
    interval: match.interval,
    priceId
  }
}

export function getGuardPlansFromPrices(priceIds) {
  if (!Array.isArray(priceIds)) return []

  return priceIds
    .map(getGuardPlanFromPrice)
    .filter(Boolean)
}
