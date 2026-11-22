
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
