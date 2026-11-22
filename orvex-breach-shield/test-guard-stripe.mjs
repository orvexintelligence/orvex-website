
import test from 'node:test'
import assert from 'node:assert/strict'
import { verifyGuardCheckout } from './server/guardStripeReconcile.js'
import { getGuardPlanFromPrice } from './server/guardStripePrices.js'

test('Rifiuta un identificativo Checkout non valido', async () => {
  const result = await verifyGuardCheckout(
    {},
    {},
    'checkout_inventato'
  )

  assert.equal(result.verified, false)
  assert.equal(result.reason, 'ID sessione non valido')
})

test('Rifiuta un Checkout non pagato', async () => {
  const fakeStripe = {
    checkout: {
      sessions: {
        retrieve: async () => ({
          status: 'open',
          payment_status: 'unpaid',
          mode: 'subscription',
          livemode: true
        })
      }
    }
  }

  const result = await verifyGuardCheckout(
    fakeStripe,
    {},
    'cs_test_simulato'
  )

  assert.equal(result.verified, false)
  assert.equal(result.reason, 'Checkout non pagato o non Live')
})

test('Ignora un prezzo appartenente a un altro servizio', () => {
  const result = getGuardPlanFromPrice('price_altro_servizio')

  assert.equal(result, null)
})

import { processGuardLifecycleEvent } from './server/guardStripeLifecycle.js'

test('Non elabora una fattura senza abbonamento Guard collegato', async () => {
  const fakeAdmin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: null
          })
        })
      })
    })
  }

  const result = await processGuardLifecycleEvent(
    {},
    fakeAdmin,
    {
      type: 'invoice.paid',
      data: {
        object: {
          id: 'in_test_simulata',
          subscription: 'sub_non_collegata'
        }
      }
    }
  )

  assert.equal(result.handled, false)
})

test('Non elabora cancellazione di abbonamento sconosciuto', async () => {
  const fakeAdmin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: null,
            error: null
          })
        })
      })
    })
  }

  const result = await processGuardLifecycleEvent(
    {},
    fakeAdmin,
    {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          id: 'sub_non_collegata'
        }
      }
    }
  )

  assert.equal(result.handled, false)
})

test('Non revoca Premium per una cancellazione obsoleta', async () => {
  const subscriptionId = 'sub_guard_evento_vecchio'

  const record = {
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: 'cus_guard_simulato',
    auth_user_id: 'utente_test_simulato',
    paid_through: '2027-01-01T00:00:00.000Z'
  }

  let updateCalled = false

  const fakeAdmin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: record,
            error: null
          })
        })
      }),
      update: () => ({
        eq: async () => {
          updateCalled = true
          return { error: null }
        }
      })
    }),
    rpc: async () => ({ error: null })
  }

  const fakeStripe = {
    subscriptions: {
      retrieve: async () => ({
        id: subscriptionId,
        customer: record.stripe_customer_id,
        status: 'active'
      })
    }
  }

  const result = await processGuardLifecycleEvent(
    fakeStripe,
    fakeAdmin,
    {
      type: 'customer.subscription.deleted',
      data: {
        object: { id: subscriptionId }
      }
    }
  )

  assert.equal(updateCalled, false)
  assert.equal(result.handled, false)
})

test('Revoca una cancellazione confermata da Stripe', async () => {
  const subscriptionId = 'sub_guard_canceled'
  const customerId = 'cus_guard_canceled'
  const userId = 'utente_canceled'

  const record = {
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    auth_user_id: userId,
    paid_through: '2027-01-01T00:00:00.000Z'
  }

  let savedChanges = null
  let refreshedUser = null

  const fakeAdmin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: record,
            error: null
          })
        })
      }),
      update: changes => ({
        eq: async () => {
          savedChanges = changes
          return { error: null }
        }
      })
    }),
    rpc: async (name, params) => {
      assert.equal(name, 'guard_refresh_user_plan')
      refreshedUser = params.p_auth_user_id
      return { error: null }
    }
  }

  const fakeStripe = {
    subscriptions: {
      retrieve: async () => ({
        id: subscriptionId,
        customer: customerId,
        status: 'canceled'
      })
    }
  }

  const result = await processGuardLifecycleEvent(
    fakeStripe,
    fakeAdmin,
    {
      type: 'customer.subscription.deleted',
      data: {
        object: { id: subscriptionId }
      }
    }
  )

  assert.equal(result.handled, true)
  assert.equal(result.action, 'canceled')
  assert.equal(savedChanges.status, 'canceled')
  assert.equal(savedChanges.paid_through, null)
  assert.equal(refreshedUser, userId)
})


test('Registra una fattura Guard pagata e aggiorna la scadenza', async () => {
  const subscriptionId = 'sub_guard_simulato'
  const customerId = 'cus_guard_simulato'
  const invoiceId = 'in_guard_simulata'
  const priceId = 'price_1TfQR5EOeFY4IpjhH4Kl0wbF'
  const userId = 'utente_test_simulato'
  const expiry = Math.floor(Date.now() / 1000) + 86400 * 30

  const record = {
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    stripe_price_id: priceId,
    auth_user_id: userId,
    paid_through: null
  }

  let savedChanges = null
  let refreshedUser = null

  const fakeAdmin = {
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({
            data: record,
            error: null
          })
        })
      }),
      update: changes => ({
        eq: async () => {
          savedChanges = changes
          return { error: null }
        }
      })
    }),
    rpc: async (name, params) => {
      assert.equal(name, 'guard_refresh_user_plan')
      refreshedUser = params.p_auth_user_id
      return { error: null }
    }
  }

  const fakeStripe = {
    invoices: {
      retrieve: async () => ({
        id: invoiceId,
        subscription: subscriptionId,
        customer: customerId,
        status: 'paid',
        paid: true
      }),
      listLineItems: async () => ({
        has_more: false,
        data: [{
          price: { id: priceId },
          period: { end: expiry }
        }]
      })
    },
    subscriptions: {
      retrieve: async () => ({
        id: subscriptionId,
        customer: customerId,
        status: 'active'
      })
    }
  }

  const result = await processGuardLifecycleEvent(
    fakeStripe,
    fakeAdmin,
    {
      type: 'invoice.paid',
      data: {
        object: {
          id: invoiceId,
          subscription: subscriptionId
        }
      }
    }
  )

  assert.equal(result.handled, true)
  assert.equal(result.action, 'invoice_paid')
  assert.equal(savedChanges.status, 'active')
  assert.equal(savedChanges.last_paid_invoice_id, invoiceId)
  assert.equal(
    savedChanges.paid_through,
    new Date(expiry * 1000).toISOString()
  )
  assert.equal(refreshedUser, userId)
})
