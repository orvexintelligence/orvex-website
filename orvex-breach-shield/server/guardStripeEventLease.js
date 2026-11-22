export async function claimGuardStripeEvent(admin, eventId) {
  const { data, error } = await admin.rpc(
    'guard_claim_stripe_event',
    { p_event_id: eventId }
  )

  if (error) throw error

  if (!data || typeof data.status !== 'string') {
    throw new Error('Risposta acquisizione evento non valida')
  }

  if (data.status === 'claimed') {
    if (!Number.isInteger(data.attempt) || data.attempt < 1) {
      throw new Error('Numero tentativo non valido')
    }
  }

  return data
}

export async function finishGuardStripeEvent(
  admin,
  eventId,
  attempt,
  status
) {
  if (!['processed', 'pending', 'rejected'].includes(status)) {
    throw new Error('Stato evento non valido')
  }

  const { data, error } = await admin.rpc(
    'guard_finish_stripe_event',
    {
      p_event_id: eventId,
      p_attempt: attempt,
      p_status: status
    }
  )

  if (error) throw error

  if (data !== true) {
    throw new Error('Tentativo evento non piu valido')
  }

  return true
}
