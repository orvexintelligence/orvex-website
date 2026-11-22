
const GUARD_PRICES = [
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

export function getGuardPlanFromPrice(priceId) {
  if (typeof priceId !== 'string' || !priceId) {
    return null
  }

  const match = GUARD_PRICES.find(
    item => process.env[item.env]?.trim() === priceId
  )

  if (!match) {
    return null
  }

  return {
    plan: match.plan,
    interval: match.interval,
    priceId
  }
}

export function getGuardPlansFromPrices(priceIds) {
  if (!Array.isArray(priceIds)) {
    return []
  }

  return priceIds
    .map(getGuardPlanFromPrice)
    .filter(Boolean)
}
