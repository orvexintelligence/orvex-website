import test from 'node:test'
import assert from 'node:assert/strict'
import { createGuardStripeWebhook } from './server/routes/guardStripeWebhook.js'

test('Dopo una risposta SQL persa, il retry non ripete aggiornamenti', async () => {
  const eventId = 'evt_guard_atomic_recovery'
  const subscriptionId = 'sub_guard_atomic_recovery'
  const customerId = 'cus_guard_atomic_recovery'
  const priceId = 'price_1TfQR5EOeFY4IpjhH4Kl0wbF'

  let eventState = 'pending'
  let attempts = 0
  let updates = 0
  let refreshes = 0

  const items = {
    has_more: false,
    data: [{ price: { id: priceId } }]
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
        items
      }
    }
  }

  const stripe = {
    webhooks: {
      constructEvent: () => event
    },
    subscriptions: {
      retrieve: async () => ({
        id: subscriptionId,
        customer: customerId,
        status: 'active',
        items
      })
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
                  auth_user_id: 'utente_test_simulato'
                },
                error: null
              })
            })
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

      if (name === 'guard_apply_subscription_update') {
        assert.equal(args.p_event_id, eventId)
        assert.equal(args.p_attempt, 1)
        assert.equal(args.p_subscription_id, subscriptionId)
        assert.equal(args.p_customer_id, customerId)
        assert.equal(args.p_price_id, priceId)
        assert.equal(args.p_status, 'active')

        // Simula la transazione PostgreSQL completa.
        updates++
        refreshes++
        eventState = 'processed'

        // La transazione e' riuscita, ma la risposta
        // non raggiunge il backend.
        return {
          data: null,
          error: { message: 'Risposta SQL persa' }
        }
      }

      if (name === 'guard_finish_stripe_event') {
        // Un tentativo vecchio non puo annullare
        // lo stato processed gia registrato.
        return { data: false, error: null }
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

  function makeResponse() {
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

  // Prima consegna: transazione completata,
  // ma il backend riceve un errore.
  const first = makeResponse()
  await handler(request, first)

  assert.equal(first.statusCode, 503)
  assert.equal(eventState, 'processed')
  assert.equal(updates, 1)

  // Seconda consegna dello stesso evento.
  const second = makeResponse()
  await handler(request, second)

  assert.equal(second.statusCode, 200)
  assert.equal(second.body.duplicate, true)
  assert.equal(updates, 1)
  assert.equal(refreshes, 1)
  assert.equal(attempts, 1)
})
