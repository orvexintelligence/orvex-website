import { getGuardPlanFromPrice } from './guardStripePrices.js'

// Existing Live Payment Links: never recreate or change their URLs.
export const GUARD_PAYMENT_LINKS = {
  plink_1TfQccEOeFY4Ipjh5hUupwtd: 'STRIPE_GUARD_PREMIUM_MONTHLY_PRICE_ID',
  plink_1TfQdEEOeFY4IpjhHQ5d1JD8: 'STRIPE_GUARD_PREMIUM_YEARLY_PRICE_ID',
  plink_1TfQabEOeFY4Ipjh27RyOfjb: 'STRIPE_GUARD_SMALL_B2B_MONTHLY_PRICE_ID',
  plink_1TfQbfEOeFY4Ipjho7fLQvPo: 'STRIPE_GUARD_SMALL_B2B_YEARLY_PRICE_ID'
}
const id = value => typeof value === 'string' ? value : value?.id

export async function processDirectGuardPurchase(stripe, admin, session) {
  const config = GUARD_PAYMENT_LINKS[id(session.payment_link)]
  if (!config) return { recorded: false, reason: 'Payment Link differente' }
  const lines = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 })
  const priceId = id(lines.data?.[0]?.price)
  const plan = getGuardPlanFromPrice(priceId)
  if (lines.has_more || lines.data?.length !== 1 || lines.data[0].quantity !== 1 ||
      !plan || priceId !== process.env[config]?.trim()) {
    return { recorded: false, reason: 'Prezzo Checkout non autorizzato' }
  }
  // Only the immutable checkout email snapshot; never customer.email or browser input.
  const email = session.customer_details?.email?.trim().toLowerCase()
  if (!email || email.length > 254 || !email.includes('@')) {
    return { recorded: false, reason: 'Email acquisto mancante' }
  }
  const subscriptionId = id(session.subscription)
  const customerId = id(session.customer)
  if (!subscriptionId || !customerId) return { recorded: false, reason: 'Abbonamento o cliente mancante' }
  const sub = await stripe.subscriptions.retrieve(subscriptionId)
  if (sub.livemode !== true || id(sub.customer) !== customerId ||
      !['active', 'past_due'].includes(sub.status) || sub.items?.has_more ||
      sub.items?.data?.length !== 1 || id(sub.items.data[0].price) !== priceId ||
      sub.items.data[0].quantity !== 1) {
    return { recorded: false, reason: 'Abbonamento non attivo o incoerente' }
  }
  const { data, error } = await admin.rpc('guard_record_direct_purchase', {
    p_session_id: session.id, p_subscription_id: subscriptionId,
    p_customer_id: customerId, p_price_id: priceId, p_plan: plan.plan,
    p_checkout_email: email
  })
  if (error || data !== true) throw new Error('Registrazione acquisto diretto non confermata')
  return { recorded: true, subscriptionId, plan: plan.plan, interval: plan.interval }
}

export async function claimGuardPurchases(admin, user) {
  if (!user?.email_confirmed_at) return
  // SQL rechecks auth.users and serializes ownership; no email or plan from the browser.
  const { error } = await admin.rpc('guard_claim_direct_purchases', { p_user_id: user.id })
  if (error) throw new Error('Associazione acquisti temporaneamente non disponibile')
}
