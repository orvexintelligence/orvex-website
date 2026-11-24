import test from 'node:test'
import assert from 'node:assert/strict'
import { processGuardLifecycleEvent } from './server/guardStripeLifecycle.js'

test('Cancellazione Guard: usa la transazione atomica', async () => {
  const subscriptionId = 'sub_guard_cancel_atomic'
  const customerId = 'cus_guard_cancel_atomic'
  const priceId = 'price_1TfQR5EOeFY4IpjhH4Kl0wbF'
  const eventId = 'evt_guard_cancel_atomic'

  let atomicCalls = 0
  let separateUpdates = 0
  let separateRefreshes = 0

  const record = {
    stripe_subscription_id: subscriptionId,
    stripe_customer_id: customerId,
    stripe_price_id: priceId,
    auth_user_id: 'utente_simulato',
    paid_through: '2027-01-01T00:00:00.000Z'
  }

  const admin = {
    from: table => {
      assert.equal(table, 'guard_stripe_subscriptions')

      return {
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
            separateUpdates++
            return { error: null }
          }
        })
      }
    },
    rpc: async (name, args) => {
      if (name === 'guard_apply_subscription_cancellation') {
        atomicCalls++

        assert.equal(args.p_event_id, eventId)
        assert.equal(args.p_attempt, 1)
        assert.equal(args.p_subscription_id, subscriptionId)
        assert.equal(args.p_customer_id, customerId)
        assert.equal(args.p_price_id, priceId)

        return { data: true, error: null }
      }

      if (name === 'guard_refresh_user_plan') {
        separateRefreshes++
        return { data: null, error: null }
      }

      throw new Error('RPC inattesa: ' + name)
    }
  }

  const stripe = {
    subscriptions: {
      retrieve: async () => ({
        id: subscriptionId,
        customer: customerId,
        status: 'canceled'
      })
    }
  }

  const result = await processGuardLifecycleEvent(
    stripe,
    admin,
    {
      type: 'customer.subscription.deleted',
      data: {
        object: { id: subscriptionId }
      }
    },
    {
      eventId,
      attempt: 1
    }
  )

  assert.equal(result.handled, true)
  assert.equal(result.action, 'canceled')
  assert.equal(result.eventFinalized, true)

  assert.equal(atomicCalls, 1)
  assert.equal(separateUpdates, 0)
  assert.equal(separateRefreshes, 0)
})
