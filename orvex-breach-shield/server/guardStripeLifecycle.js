
import { getGuardPlanFromPrice } from './guardStripePrices.js'

function stripeId(value) {
  if (typeof value === 'string') return value
  return value?.id ?? null
}

function unixDate(value) {
  return Number.isInteger(value) && value > 0
    ? new Date(value * 1000).toISOString()
    : null
}

function invoiceSubscriptionId(invoice) {
  return stripeId(invoice.parent?.subscription_details?.subscription)
    ?? stripeId(invoice.subscription)
}

function invoiceLinePriceId(line) {
  return stripeId(line.pricing?.price_details?.price)
    ?? stripeId(line.price)
}

async function findGuardSubscription(admin, subscriptionId) {
  if (!subscriptionId) return null

  const { data, error } = await admin
    .from('guard_stripe_subscriptions')
    .select('*')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle()

  if (error) throw error

  // Non associamo abbonamenti usando soltanto l'email.
  if (!data) return null

  return data
}

async function updateSubscription(admin, subscriptionId, changes) {
  const { error } = await admin
    .from('guard_stripe_subscriptions')
    .update({
      ...changes,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscriptionId)

  if (error) throw error
}

async function refreshPlan(admin, userId) {
  if (!userId) return
  const { error } = await admin.rpc(
    'guard_refresh_user_plan',
    { p_auth_user_id: userId }
  )

  if (error) throw error
}

export async function processGuardLifecycleEvent(
  stripe,
  admin,
  event,
  lease = null
) {
  const type = event.type
  const object = event.data?.object ?? {}

  // 1. Fatture pagate e pagamenti non riusciti.
  if (
    type === 'invoice.paid' ||
    type === 'invoice.payment_failed'
  ) {
    const subscriptionId = invoiceSubscriptionId(object)

    const record = await findGuardSubscription(
      admin,
      subscriptionId
    )

    if (!record) {
      return { handled: false, reason: 'Abbonamento non collegato' }
    }

    // Rileggiamo la fattura direttamente da Stripe.
    const invoice = await stripe.invoices.retrieve(object.id)

    if (
      invoiceSubscriptionId(invoice) !== subscriptionId ||
      stripeId(invoice.customer) !== record.stripe_customer_id
    ) {
      throw new Error('Fattura non coerente con abbonamento Guard')
    }

    const subscription =
      await stripe.subscriptions.retrieve(subscriptionId)

    if (
      stripeId(subscription.customer) !== record.stripe_customer_id
    ) {
      throw new Error('Cliente Stripe differente')
    }

    if (type === 'invoice.payment_failed') {
      // Non estendiamo il periodo pagato.
      // L'eventuale accesso già pagato resta valido
      // fino alla sua scadenza.
      await updateSubscription(admin, subscriptionId, {
        status: subscription.status
      })

      await refreshPlan(admin, record.auth_user_id)

      return { handled: true, action: 'payment_failed' }
    }

    // Non basta l'evento invoice.paid:
    // controlliamo il documento attuale su Stripe.
    if (
      invoice.status !== 'paid' ||
      invoice.paid !== true
    ) {
      throw new Error('Fattura non confermata come pagata')
    }

    if (!['active', 'past_due'].includes(subscription.status)) {
      throw new Error('Abbonamento non idoneo al rinnovo')
    }

    const lines = await stripe.invoices.listLineItems(
      invoice.id,
      { limit: 100 }
    )

    if (lines.has_more) {
      throw new Error('Fattura con troppe righe da verificare')
    }

    // Accettiamo soltanto il prezzo registrato
    // per questo specifico abbonamento Guard.
    const eligible = lines.data.filter(line =>
      invoiceLinePriceId(line) === record.stripe_price_id &&
      getGuardPlanFromPrice(invoiceLinePriceId(line))
    )

    if (eligible.length !== 1) {
      throw new Error('Prezzo Guard non verificabile sulla fattura')
    }

    const line = eligible[0]

    // Il periodo pagato deriva dalla riga fattura,
    // non dalla sola data futura dell'abbonamento.
    const paidUntil = unixDate(line.period?.end)

    if (!paidUntil) {
      throw new Error('Scadenza fattura mancante')
    }

    // Evita che una vecchia fattura riduca la
    // scadenza già registrata.
    const previous = record.paid_through
      ? Date.parse(record.paid_through)
      : 0

    const newExpiry = Math.max(
      previous,
      Date.parse(paidUntil)
    )

    if (lease) {
      const { data, error } = await admin.rpc(
        'guard_apply_paid_invoice',
        {
          p_event_id: lease.eventId,
          p_attempt: lease.attempt,
          p_subscription_id: subscriptionId,
          p_customer_id: record.stripe_customer_id,
          p_price_id: record.stripe_price_id,
          p_invoice_id: invoice.id,
          p_paid_through: new Date(newExpiry).toISOString(),
          p_status: subscription.status
        }
      )

      if (error) throw error

      if (data !== true) {
        throw new Error('Fattura atomica non confermata')
      }

      return {
        handled: true,
        action: 'invoice_paid',
        eventFinalized: true
      }
    }

    // Checkout reconciliation can race invoice webhooks. Preserve the greatest
    // paid-through date and terminal cancellation inside one SQL transaction.
    const { data: applied, error: applyError } = await admin.rpc('guard_sync_paid_invoice', {
      p_subscription_id: subscriptionId, p_customer_id: record.stripe_customer_id,
      p_price_id: record.stripe_price_id, p_invoice_id: invoice.id,
      p_paid_through: new Date(newExpiry).toISOString(), p_status: subscription.status
    })
    if (applyError || applied !== true) throw new Error('Fattura non sincronizzata')

    return { handled: true, action: 'invoice_paid' }
  }

  // 2. Aggiornamenti e cancellazioni abbonamento.
  if (
    type === 'customer.subscription.updated' ||
    type === 'customer.subscription.deleted'
  ) {
    const subscriptionId = stripeId(object.id)

    const record = await findGuardSubscription(
      admin,
      subscriptionId
    )

    if (!record) {
      return { handled: false, reason: 'Abbonamento non collegato' }
    }

    if (type === 'customer.subscription.deleted') {
      // Controlla lo stato attuale direttamente su Stripe.
      const currentSubscription =
        await stripe.subscriptions.retrieve(subscriptionId)

      if (
        stripeId(currentSubscription.customer) !==
        record.stripe_customer_id
      ) {
        throw new Error('Cliente Stripe differente')
      }

      if (currentSubscription.status !== 'canceled') {
        return {
          handled: false,
          reason: 'Cancellazione non confermata da Stripe'
        }
      }
      // L'abbonamento è terminato.
      // Non concediamo ulteriori periodi di accesso.
      if (lease) {
        const { data, error } = await admin.rpc(
          'guard_apply_subscription_cancellation',
          {
            p_event_id: lease.eventId,
            p_attempt: lease.attempt,
            p_subscription_id: subscriptionId,
            p_customer_id: record.stripe_customer_id,
            p_price_id: record.stripe_price_id
          }
        )

        if (error) throw error

        if (data !== true) {
          throw new Error('Cancellazione atomica non confermata')
        }

        return {
          handled: true,
          action: 'canceled',
          eventFinalized: true
        }
      }

      await updateSubscription(admin, subscriptionId, {
        status: 'canceled',
        paid_through: null
      })

      await refreshPlan(admin, record.auth_user_id)

      return { handled: true, action: 'canceled' }
    }

    const subscription =
      await stripe.subscriptions.retrieve(subscriptionId)

    if (
      stripeId(subscription.customer) !== record.stripe_customer_id
    ) {
      throw new Error('Cliente Stripe differente')
    }

    const activePrices = subscription.items?.data?.map(
      item => stripeId(item.price)
    ) ?? []

    // Se il prodotto non è più quello Guard registrato,
    // non concediamo automaticamente nuovi diritti.
    const priceUnchanged =
      !subscription.items?.has_more &&
      activePrices.length === 1 &&
      activePrices[0] === record.stripe_price_id

    if (!priceUnchanged) {
      // Una modifica di piano richiede una verifica
      // separata della fattura di cambio piano.
      return {
        handled: false,
        reason: 'Modifica prezzo da riconciliare'
      }
    }

    if (lease) {
      const { data, error } = await admin.rpc(
        'guard_apply_subscription_update',
        {
          p_event_id: lease.eventId,
          p_attempt: lease.attempt,
          p_subscription_id: subscriptionId,
          p_customer_id: record.stripe_customer_id,
          p_price_id: record.stripe_price_id,
          p_status: subscription.status
        }
      )

      if (error) throw error

      if (data !== true) {
        throw new Error('Aggiornamento atomico non confermato')
      }

      return {
        handled: true,
        action: 'subscription_updated',
        eventFinalized: true
      }
    }

    await updateSubscription(admin, subscriptionId, {
      status: subscription.status
    })

    // Il solo aggiornamento dell'abbonamento
    // non estende paid_through.
    await refreshPlan(admin, record.auth_user_id)

    return { handled: true, action: 'subscription_updated' }
  }

  return { handled: false, reason: 'Evento non gestito' }
}
