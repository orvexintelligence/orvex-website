import test from 'node:test'
import assert from 'node:assert/strict'
import {
  claimGuardStripeEvent,
  finishGuardStripeEvent
} from './server/guardStripeEventLease.js'

test('Acquisisce un evento Stripe', async () => {
  const admin = {
    rpc: async (name, args) => {
      assert.equal(name, 'guard_claim_stripe_event')
      assert.equal(args.p_event_id, 'evt_simulato')
      return {
        data: { status: 'claimed', attempt: 1 },
        error: null
      }
    }
  }

  const result = await claimGuardStripeEvent(
    admin,
    'evt_simulato'
  )

  assert.equal(result.status, 'claimed')
  assert.equal(result.attempt, 1)
})

test('Riconosce un evento gia in elaborazione', async () => {
  const admin = {
    rpc: async () => ({
      data: { status: 'processing' },
      error: null
    })
  }

  const result = await claimGuardStripeEvent(
    admin,
    'evt_simulato'
  )

  assert.equal(result.status, 'processing')
})

test('Completa un evento con il tentativo corretto', async () => {
  const admin = {
    rpc: async (name, args) => {
      assert.equal(name, 'guard_finish_stripe_event')
      assert.equal(args.p_attempt, 2)
      assert.equal(args.p_status, 'processed')
      return { data: true, error: null }
    }
  }

  assert.equal(
    await finishGuardStripeEvent(
      admin,
      'evt_simulato',
      2,
      'processed'
    ),
    true
  )
})

test('Rifiuta un tentativo scaduto', async () => {
  const admin = {
    rpc: async () => ({
      data: false,
      error: null
    })
  }

  await assert.rejects(
    finishGuardStripeEvent(
      admin,
      'evt_simulato',
      1,
      'processed'
    ),
    /Tentativo evento non piu valido/
  )
})
