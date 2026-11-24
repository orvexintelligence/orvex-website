
import { verifyGuardCheckout } from './guardStripeReconcile.js'
import { processDirectGuardPurchase } from './guardDirectPurchase.js'

// Da chiamare esclusivamente dal backend,
// dopo la verifica della firma del webhook Stripe.
//
// Non aggiornare direttamente guard_profiles.plan.

export async function processGuardCheckout(
  stripe,
  admin,
  checkoutSessionId
) {
  if (typeof checkoutSessionId !== 'string' || !checkoutSessionId.startsWith('cs_')) {
    return { recorded: false, reason: 'ID sessione non valido' }
  }
  const session = await stripe.checkout.sessions.retrieve(checkoutSessionId)
  if (session.livemode !== true || session.status !== 'complete' ||
      session.payment_status !== 'paid' || session.mode !== 'subscription') {
    return { recorded: false, reason: 'Checkout non pagato o non Live' }
  }
  // A client_reference_id on a public Payment Link is user-controlled. Direct
  // purchases always require verified email ownership, even if one is supplied.
  if (session.payment_link) return processDirectGuardPurchase(stripe, admin, session)
  // 1. Controlla il pagamento direttamente su Stripe.
  const result = await verifyGuardCheckout(
    stripe,
    admin,
    checkoutSessionId
  )

  // 2. Se la verifica fallisce, non registrare nulla.
  if (!result.verified) {
    return {
      recorded: false,
      reason: result.reason
    }
  }

  // 3. Registra in modo atomico il collegamento
  // tra acquisto, abbonamento e account Supabase.
  const { data, error } = await admin.rpc(
    'guard_record_verified_checkout',
    {
      p_intent_id: result.checkoutIntentId,
      p_checkout_session_id: result.checkoutSessionId,
      p_subscription_id: result.subscriptionId,
      p_customer_id: result.customerId,
      p_price_id: result.priceId
    }
  )

  if (error) {
    throw new Error(
      `Registrazione abbonamento fallita: ${error.message}`
    )
  }

  if (data !== true) {
    throw new Error(
      'La registrazione non e stata confermata'
    )
  }

  return {
    recorded: true,
    subscriptionId: result.subscriptionId,
    plan: result.plan,
    interval: result.interval,
    status: 'pending_verification'
  }
}
