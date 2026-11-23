
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getGuardPlanFromPrice, getGuardStripeMode } from '../guardStripePrices.js'
import { processGuardCheckout } from '../guardStripeProcessCheckout.js'
import { processGuardLifecycleEvent } from '../guardStripeLifecycle.js'
import {
  claimGuardStripeEvent,
  finishGuardStripeEvent
} from '../guardStripeEventLease.js'

let stripe
let supabaseAdmin

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY?.trim()
  if (!key) throw new Error('STRIPE_SECRET_KEY mancante')

  if (!stripe) stripe = new Stripe(key)
  return stripe
}

function getAdmin() {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Supabase non configurato')
    }

    supabaseAdmin = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  }

  return supabaseAdmin
}

const EVENTS = new Set([
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'invoice.paid',
  'invoice.payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted'
])

function id(value) {
  if (typeof value === 'string') return value
  return value?.id ?? null
}

function linePriceId(line) {
  return id(line?.price)
    ?? id(line?.pricing?.price_details?.price)
    ?? id(line?.plan)
    ?? null
}

async function getEventPrices(event, api) {
  const object = event.data.object

  if (event.type.startsWith('checkout.session.')) {
    const prices = []

    for await (const line of api.checkout.sessions.listLineItems(
      object.id,
      { limit: 100 }
    )) {
      const price = linePriceId(line)
      if (price) prices.push(price)
    }

    return prices
  }

  if (event.type.startsWith('invoice.')) {
    const prices = []

    for await (const line of api.invoices.listLineItems(
      object.id,
      { limit: 100 }
    )) {
      const price = linePriceId(line)
      if (price) prices.push(price)
    }

    return prices
  }

  if (event.type.startsWith('customer.subscription.')) {
    return (object.items?.data ?? [])
      .map(linePriceId)
      .filter(Boolean)
  }

  return []
}

async function updateEventStatus(admin, eventId, status) {
  const { error } = await admin
    .from('guard_stripe_events')
    .update({
      processing_status: status,
      processed_at: new Date().toISOString()
    })
    .eq('stripe_event_id', eventId)

  if (error) throw error
}

export function createGuardStripeWebhook(deps = {}) {
  const getStripeClient = () => deps.stripe ?? getStripe()
  const getAdminClient = () => deps.admin ?? getAdmin()

  return async function handleGuardStripeWebhook(req, res) {
    // Blocca ogni scrittura nel database condiviso in modalita Sandbox.
    let mode
    try { mode = getGuardStripeMode() } catch {
      return res.status(503).json({ error: 'Configurazione Stripe non valida' })
    }
    if (mode === 'test') {
      return res.status(503).json({
        error: 'Webhook Sandbox non ancora isolato'
      })
    }
    const secret = deps.secret ??
      process.env.STRIPE_GUARD_WEBHOOK_SECRET?.trim()

  if (!secret) {
    return res.status(503).json({
      error: 'Webhook non configurato'
    })
  }

  const signature = req.headers['stripe-signature']

  if (!signature || !Buffer.isBuffer(req.body)) {
    return res.status(400).json({
      error: 'Richiesta non valida'
    })
  }

  let event

  try {
    event = getStripeClient().webhooks.constructEvent(
      req.body,
      signature,
      secret
    )
  } catch (error) {
    console.error(
      '[Guard Stripe] Firma non valida:',
      error.message
    )

    return res.status(400).json({
      error: 'Firma non valida'
    })
  }

  if (event.livemode !== true) {
    return res.status(400).json({ error: 'Evento non Live' })
  }

  if (!EVENTS.has(event.type)) {
    return res.status(200).json({
      received: true,
      ignored: true
    })
  }

  let leaseAttempt = null
  let leaseAdmin = null

  try {
    const admin = getAdminClient()
    const object = event.data.object

    const prices = [
      ...new Set(await getEventPrices(event, getStripeClient()))
    ]

    const matches = prices
      .map(getGuardPlanFromPrice)
      .filter(Boolean)

    // Non elaborare prezzi di altri servizi Orvex.
    if (
      matches.length === 0 ||
      matches.length !== prices.length ||
      new Set(matches.map(x => x.plan)).size !== 1
    ) {
      return res.status(200).json({
        received: true,
        ignored: true
      })
    }

    const payload = {
      object_id: id(object.id),
      object_type: object.object ?? null,
      customer_id: id(object.customer),

      subscription_id:
        id(object.subscription)
        ?? id(object.parent?.subscription_details?.subscription)
        ?? (
          object.object === 'subscription'
            ? id(object.id)
            : null
        ),

      client_reference_id:
        event.type.startsWith('checkout.session.')
          ? object.client_reference_id ?? null
          : null,

      payment_link_id:
        event.type.startsWith('checkout.session.')
          ? id(object.payment_link)
          : null,

      payment_status: object.payment_status ?? null,
      status: object.status ?? null,
      livemode: event.livemode === true,
      guard_price_ids: prices,
      guard_plan: matches[0].plan
    }

    // Registra prima l'evento, anche se l'elaborazione
    // successiva dovesse fallire.
    const { error: saveError } = await admin
      .from('guard_stripe_events')
      .upsert(
        {
          stripe_event_id: event.id,
          event_type: event.type,
          event_payload: payload,
          processing_status: 'pending',
          processed_at: null
        },
        {
          onConflict: 'stripe_event_id',
          ignoreDuplicates: true
        }
      )

    if (saveError) throw saveError

    const claim = await claimGuardStripeEvent(admin, event.id)

    if (claim.status === 'processed' || claim.status === 'rejected') {
      return res.status(200).json({
        received: true,
        duplicate: true,
        status: claim.status
      })
    }

    if (claim.status !== 'claimed') {
      return res.status(503).json({
        error: 'Evento gia in elaborazione o non acquisibile'
      })
    }

    leaseAttempt = claim.attempt
    leaseAdmin = admin

    // Rinnovi, mancati pagamenti e cancellazioni.
    if (!event.type.startsWith('checkout.session.')) {
      const result = await processGuardLifecycleEvent(
        getStripeClient(),
        admin,
        event,
        {
          eventId: event.id,
          attempt: leaseAttempt
        }
      )

      if (!result.handled) {
        // Conserva l'evento come pending.
        // Stripe potra riprovare se Checkout non
        // e ancora stato collegato all'account.
        console.warn(
          '[Guard Stripe] Evento da riconciliare:',
          event.id,
          result.reason
        )

        await finishGuardStripeEvent(
          admin, event.id, leaseAttempt, 'pending'
        )
        leaseAttempt = null

        return res.status(503).json({
          error: 'Riconciliazione in sospeso'
        })
      }

      if (!result.eventFinalized) {
        await finishGuardStripeEvent(
          admin, event.id, leaseAttempt, 'processed'
        )
      }

      leaseAttempt = null

      return res.status(200).json({
        received: true,
        action: result.action
      })
    }

    // Per Checkout eseguiamo la verifica completa.
    const result = await processGuardCheckout(
      getStripeClient(),
      admin,
      object.id
    )

    if (!result.recorded) {
      console.warn(
        '[Guard Stripe] Checkout non riconciliato:',
        event.id,
        result.reason
      )

      const permanentReasons = new Set([
        'ID sessione non valido',
        'Riferimento acquisto mancante',
        'Acquisto fuori validita',
        'Payment Link differente',
        'Acquisto gia associato a un altro Checkout',
        'Prodotti Checkout non previsti',
        'Prezzo Checkout non autorizzato',
        'Abbonamento differente',
        'Prezzo abbonamento differente'
      ])

      if (!permanentReasons.has(result.reason)) {
        await finishGuardStripeEvent(
          admin, event.id, leaseAttempt, 'pending'
        )
        leaseAttempt = null

        return res.status(503).json({
          error: 'Checkout in attesa di riconciliazione'
        })
      }

      await finishGuardStripeEvent(admin, event.id, leaseAttempt, 'rejected')

      return res.status(200).json({
        received: true,
        status: 'rejected'
      })
    }

    // Dopo aver collegato il Checkout, recuperiamo
    // anche la prima fattura: potrebbe essere
    // arrivata prima dell'evento Checkout.
    const subscription = await getStripeClient()
      .subscriptions.retrieve(result.subscriptionId)

    const invoiceId = id(subscription.latest_invoice)

    if (invoiceId) {
      const invoice = await getStripeClient()
        .invoices.retrieve(invoiceId)

      if (invoice.status === 'paid' && invoice.paid === true) {
        const paidResult = await processGuardLifecycleEvent(
          getStripeClient(),
          admin,
          {
            type: 'invoice.paid',
            data: { object: invoice }
          }
        )

        if (!paidResult.handled) {
          throw new Error('Prima fattura non riconciliata')
        }
      }
    }

    await finishGuardStripeEvent(admin, event.id, leaseAttempt, 'processed')

    console.log(
      '[Guard Stripe] Abbonamento registrato:',
      result.subscriptionId,
      result.plan
    )

    // Accesso concesso soltanto dopo fattura verificata e associazione account.
    return res.status(200).json({
      received: true,
      status: 'recorded'
    })

  } catch (error) {
    if (leaseAttempt !== null && leaseAdmin) {
      try {
        await finishGuardStripeEvent(
          leaseAdmin, event.id, leaseAttempt, 'pending'
        )
      } catch (releaseError) {
        console.error(
          '[Guard Stripe] Rilascio evento fallito:',
          releaseError.message
        )
      }
    }

    console.error(
      '[Guard Stripe] Elaborazione fallita:',
      error.message
    )

    // Stripe potra riprovare in caso
    // di errore temporaneo del backend.
    return res.status(503).json({
      error: 'Elaborazione temporaneamente non disponibile'
    })
  }
}
}

export const guardStripeWebhook = createGuardStripeWebhook()
