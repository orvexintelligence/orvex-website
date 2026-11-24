import test from 'node:test'
import assert from 'node:assert/strict'
import { processGuardLifecycleEvent } from './server/guardStripeLifecycle.js'

test('Fattura pagata: aggiornamento atomico e evento completato', async () => {
  const subscriptionId = 'sub_guard_paid_atomic'
  const customerId = 'cus_guard_paid_atomic'
  const invoiceId = 'in_guard_paid_atomic'
  const eventId = 'evt_guard_paid_atomic'
  const priceId = 'price_1TfQR5EOeFY4IpjhH4Kl0wbF'
  const expiry = Math.floor(Date.now() / 1000) + 86400 * 30

  let atomicCalls = 0
  let separateUpdates = 0
  let separateRefreshes = 0

  const admin = {
    from: table => {
      if (table !== 'guard_stripe_subscriptions') {
        throw new Error('Tabella inattesa: ' + table)
      }

      return {
        select: () => ({
          eq: () => ({
            maybeSingle: async () => ({
              data: {
                stripe_subscription_id: subscriptionId,
                stripe_customer_id: customerId,
                stripe_price_id: priceId,
                auth_user_id: 'user_test_atomic',
                paid_through: null
              },
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
      if (name === 'guard_apply_paid_invoice') {
        atomicCalls++
        assert.equal(args.p_event_id, eventId)
        assert.equal(args.p_attempt, 1)
        assert.equal(args.p_invoice_id, invoiceId)
        assert.equal(args.p_subscription_id, subscriptionId)
        assert.equal(args.p_customer_id, customerId)
        assert.equal(args.p_price_id, priceId)
        assert.equal(args.p_status, 'active')
        assert.equal(
          args.p_paid_through,
          new Date(expiry * 1000).toISOString()
        )
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
    stripe,
    admin,
    {
      type: 'invoice.paid',
      data: {
        object: {
          id: invoiceId,
          subscription: subscriptionId
        }
      }
    },
    { eventId, attempt: 1 }
  )

  assert.equal(result.handled, true)
  assert.equal(result.action, 'invoice_paid')
  assert.equal(result.eventFinalized, true)
  assert.equal(atomicCalls, 1)
  assert.equal(separateUpdates, 0)
  assert.equal(separateRefreshes, 0)
})
