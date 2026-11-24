import Stripe from 'stripe'

const secret = 'whsec_orvex_test_locale_non_reale'

const payload = JSON.stringify({
  id: 'evt_orvex_test_locale',
  object: 'event',
  type: 'orvex.test.ignored',
  livemode: false,
  data: {
    object: {
      id: 'obj_test_locale'
    }
  }
})

const signature = Stripe.webhooks.generateTestHeaderString({
  payload,
  secret
})

const response = await fetch(
  'http://localhost:3111/api/guard/stripe/webhook',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Stripe-Signature': signature
    },
    body: payload
  }
)

console.log('HTTP:', response.status)
console.log('Risposta:', await response.text())
