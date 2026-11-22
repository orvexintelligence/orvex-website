import test from 'node:test'
import assert from 'node:assert/strict'
import { processGuardLifecycleEvent } from './server/guardStripeLifecycle.js'

test('Errore Stripe: nessuna revoca e richiesta ritentabile', async () => {
  const record = {
    stripe_subscription_id: 'sub_guard_stripe_error',
    stripe_customer_id: 'cus_guard_stripe_error',
    auth_user_id: 'user_simulato',
    paid_through: '2027-01-01T00:00:00.000Z'
  }

  let updates = 0
  let refreshes = 0

  const admin = {
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
          updates++
          return { error: null }
        }
      })
    }),
    rpc: async () => {
      refreshes++
      return { error: null }
    }
  }

  const stripe = {
    subscriptions: {
      retrieve: async () => {
        throw new Error('Stripe temporaneamente non disponibile')
      }
    }
  }

  await assert.rejects(
    processGuardLifecycleEvent(stripe, admin, {
      type: 'customer.subscription.deleted',
      data: {
        object: { id: record.stripe_subscription_id }
      }
    }),
    /Stripe temporaneamente non disponibile/
  )

  assert.equal(updates, 0)
  assert.equal(refreshes, 0)
})
