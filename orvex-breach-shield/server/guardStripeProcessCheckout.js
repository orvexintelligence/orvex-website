
import { verifyGuardCheckout } from './guardStripeReconcile.js'

// Da chiamare esclusivamente dal backend,
// dopo la verifica della firma del webhook Stripe.
//
// Non aggiornare direttamente guard_profiles.plan.

export async function processGuardCheckout(
  stripe,
  admin,
  checkoutSessionId
) {
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
