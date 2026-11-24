// Pin requests and the webhook snapshot schema to the same reviewed version.
export const GUARD_STRIPE_API_VERSION = '2026-11-18.endive'
export const GUARD_STRIPE_EVENTS = [
  'checkout.session.completed',
  'checkout.session.async_payment_succeeded',
  'invoice.paid',
  'invoice.payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted'
]

// Basil and later removed invoice.paid. Status from a fresh Stripe retrieval is
// authoritative. Reject contradictory legacy flags and outstanding balances.
export function isGuardInvoicePaid(invoice) {
  return invoice?.status === 'paid' && invoice.paid !== false &&
    (invoice.amount_remaining === undefined || invoice.amount_remaining === 0)
}
