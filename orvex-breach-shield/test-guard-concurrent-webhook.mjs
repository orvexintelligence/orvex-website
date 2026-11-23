import test from 'node:test'
import assert from 'node:assert/strict'
import { createGuardStripeWebhook } from './server/routes/guardStripeWebhook.js'

test('Due webhook contemporanei elaborano una sola volta', async () => {
  const eventId = 'evt_guard_concurrent_test'
  const subscriptionId = 'sub_guard_concurrent_test'
  const customerId = 'cus_guard_concurrent_test'
  const priceId = 'price_1TfQR5EOeFY4IpjhH4Kl0wbF'
  const userId = 'utente_test_simulato'

  let eventState = 'pending'
  let attempts = 0
  let updates = 0
  let refreshes = 0

  let signalStarted
  let releaseStripe

  const started = new Promise(resolve => {
    signalStarted = resolve
  })

  const blocked = new Promise(resolve => {
    releaseStripe = resolve
  })

  const subscription = {
    id: subscriptionId,
    customer: customerId,
    status: 'active',
    items: {
      has_more: false,
      data: [{ price: { id: priceId } }]
    }
  }

  const event = {
    livemode: true,
    id: eventId,
    type: 'customer.subscription.updated',
    data: {
      object: {
        id: subscriptionId,
        object: 'subscription',
        customer: customerId,
        items: subscription.items
      }
    }
  }

  const stripe = {
    webhooks: {
      constructEvent: () => event
    },
    subscriptions: {
      retrieve: async () => {
        signalStarted()
        await blocked
        return subscription
      }
    }
  }

  const admin = {
    from: table => {
      if (table === 'guard_stripe_events') {
        return {
          upsert: async () => ({ error: null })
        }
      }

      if (table === 'guard_stripe_subscriptions') {
        return {
          select: () => ({
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  stripe_subscription_id: subscriptionId,
                  stripe_customer_id: customerId,
                  stripe_price_id: priceId,
                  auth_user_id: userId
                },
                error: null
              })
            })
          }),
          update: () => ({
            eq: async () => {
              updates++
              return { error: null }
            }
          })
        }
      }

      throw new Error('Tabella inattesa: ' + table)
    },

    rpc: async (name, args) => {
      if (name === 'guard_claim_stripe_event') {
        if (eventState === 'pending') {
          eventState = 'processing'
          attempts++
          return {
            data: { status: 'claimed', attempt: attempts },
            error: null
          }
        }

        return {
          data: { status: eventState },
          error: null
        }
      }

      if (name === 'guard_finish_stripe_event') {
        assert.equal(args.p_attempt, attempts)
        eventState = args.p_status
        return { data: true, error: null }
      }

      if (name === 'guard_refresh_user_plan') {
        refreshes++
        return { data: null, error: null }
      }

      if (name === 'guard_apply_subscription_update') {
        assert.equal(args.p_event_id, eventId)
        assert.equal(args.p_attempt, attempts)
        assert.equal(args.p_subscription_id, subscriptionId)
        assert.equal(args.p_customer_id, customerId)
        assert.equal(args.p_price_id, priceId)
        assert.equal(args.p_status, 'active')

        updates++
        refreshes++
        eventState = 'processed'

        return { data: true, error: null }
      }
      throw new Error('RPC inattesa: ' + name)
    }
  }

  const handler = createGuardStripeWebhook({
    stripe,
    admin,
    secret: 'whsec_test_locale'
  })

  const request = {
    headers: { 'stripe-signature': 'firma_simulata' },
    body: Buffer.from('{}')
  }

  function response() {
    return {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(body) {
        this.body = body
        return this
      }
    }
  }

  const firstResponse = response()
  const secondResponse = response()

  const first = handler(request, firstResponse)

  // La prima richiesta deve avere acquisito
  // l'evento ed essere entrata nella chiamata Stripe.
  await started

  // La seconda richiesta arriva mentre
  // la prima sta ancora elaborando.
  await handler(request, secondResponse)

  assert.equal(secondResponse.statusCode, 503)
  assert.equal(updates, 0)
  assert.equal(refreshes, 0)

  releaseStripe()
  await first

  assert.equal(firstResponse.statusCode, 200)
  assert.equal(firstResponse.body.action, 'subscription_updated')
  assert.equal(updates, 1)
  assert.equal(refreshes, 1)
  assert.equal(attempts, 1)
  assert.equal(eventState, 'processed')
})
