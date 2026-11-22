
import { getGuardPlanFromPrice } from './guardStripePrices.js'

function stripeId(value) {
  if (typeof value === 'string') return value
  return value?.id ?? null
}

function reject(reason) {
  return {
    verified: false,
    reason
  }
}

// Verifica un acquisto senza modificare Supabase.
// stripe: client Stripe autenticato
// admin: client Supabase service_role
export async function verifyGuardCheckout(
  stripe,
  admin,
  sessionId
) {
  if (
    typeof sessionId !== 'string' ||
    !sessionId.startsWith('cs_')
  ) {
    return reject('ID sessione non valido')
  }

  // Rilettura diretta da Stripe: non ci fidiamo
  // dei campi presenti nel solo evento webhook.
  const session =
    await stripe.checkout.sessions.retrieve(sessionId)

  if (
    session.status !== 'complete' ||
    session.payment_status !== 'paid' ||
    session.mode !== 'subscription' ||
    session.livemode !== true
  ) {
    return reject('Checkout non pagato o non Live')
  }

  const intentId = session.client_reference_id

  if (
    typeof intentId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f-]{27,}$/i.test(intentId)
  ) {
    return reject('Riferimento acquisto mancante')
  }

  const { data: intent, error: intentError } =
    await admin
      .from('guard_checkout_intents')
      .select('*')
      .eq('id', intentId)
      .maybeSingle()

  if (intentError) throw intentError

  if (!intent) {
    return reject('Acquisto non registrato')
  }

  // Il Checkout deve essere stato creato entro
  // la scadenza dell'intenzione di acquisto.
  const checkoutCreated = session.created * 1000
  const intentCreated = Date.parse(intent.created_at)
  const intentExpires = Date.parse(intent.expires_at)

  if (
    !Number.isFinite(checkoutCreated) ||
    !Number.isFinite(intentCreated) ||
    !Number.isFinite(intentExpires) ||
    checkoutCreated < intentCreated - 60000 ||
    checkoutCreated > intentExpires
  ) {
    return reject('Acquisto fuori validita')
  }

  if (
    stripeId(session.payment_link) !==
      intent.stripe_payment_link_id
  ) {
    return reject('Payment Link differente')
  }

  if (
    intent.stripe_checkout_session_id &&
    intent.stripe_checkout_session_id !== session.id
  ) {
    return reject('Acquisto gia associato a un altro Checkout')
  }

  const lines =
    await stripe.checkout.sessions.listLineItems(
      session.id,
      { limit: 100 }
    )

  if (
    lines.has_more ||
    lines.data.length !== 1
  ) {
    return reject('Prodotti Checkout non previsti')
  }

  const priceId = stripeId(lines.data[0].price)
  const plan = getGuardPlanFromPrice(priceId)

  if (
    !plan ||
    priceId !== intent.stripe_price_id ||
    lines.data[0].quantity !== 1
  ) {
    return reject('Prezzo Checkout non autorizzato')
  }

  const subscriptionId = stripeId(session.subscription)
  const customerId = stripeId(session.customer)

  if (!subscriptionId || !customerId) {
    return reject('Abbonamento o cliente mancante')
  }

  if (
    intent.stripe_subscription_id &&
    intent.stripe_subscription_id !== subscriptionId
  ) {
    return reject('Abbonamento differente')
  }

  const subscription =
    await stripe.subscriptions.retrieve(subscriptionId)

  if (
    subscription.livemode !== true ||
    stripeId(subscription.customer) !== customerId ||
    subscription.status !== 'active'
  ) {
    return reject('Abbonamento non attivo')
  }

  const items = subscription.items?.data ?? []

  if (
    subscription.items?.has_more ||
    items.length !== 1 ||
    stripeId(items[0].price) !== priceId
  ) {
    return reject('Prezzo abbonamento differente')
  }

  // Verifica che il profilo Guard appartenga
  // all'utente Supabase registrato nell'intento.
  const { data: profile, error: profileError } =
    await admin
      .from('guard_profiles')
      .select('id, auth_user_id')
      .eq('auth_user_id', intent.auth_user_id)
      .maybeSingle()

  if (profileError) throw profileError

  if (!profile) {
    return reject('Profilo Guard non collegato')
  }

  return {
    verified: true,
    authUserId: intent.auth_user_id,
    profileId: profile.id,
    checkoutIntentId: intent.id,
    checkoutSessionId: session.id,
    subscriptionId,
    customerId,
    priceId,
    plan: plan.plan,
    interval: plan.interval
  }
}
