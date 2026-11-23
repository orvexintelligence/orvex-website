
import { Router } from 'express'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import { getGuardPlanFromPrice, getGuardStripeMode } from '../guardStripePrices.js'

const router = Router()

// Soltanto i Payment Links di Orvex Guard.
const LINKS = {
  premium_month: {
    priceEnv: 'STRIPE_GUARD_PREMIUM_MONTHLY_PRICE_ID',
    linkId: 'plink_1TfQccEOeFY4Ipjh5hUupwtd'
  },
  premium_year: {
    priceEnv: 'STRIPE_GUARD_PREMIUM_YEARLY_PRICE_ID',
    linkId: 'plink_1TfQdEEOeFY4IpjhHQ5d1JD8'
  },
  small_b2b_month: {
    priceEnv: 'STRIPE_GUARD_SMALL_B2B_MONTHLY_PRICE_ID',
    linkId: 'plink_1TfQabEOeFY4Ipjh27RyOfjb'
  },
  small_b2b_year: {
    priceEnv: 'STRIPE_GUARD_SMALL_B2B_YEARLY_PRICE_ID',
    linkId: 'plink_1TfQbfEOeFY4Ipjho7fLQvPo'
  }
}

let admin
let stripe

function getAdmin() {
  if (!admin) {
    if (!process.env.SUPABASE_URL ||
        !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase non configurato')
    }

    admin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      }
    )
  }

  return admin
}

function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY?.trim()
    if (!key) throw new Error('Stripe non configurato')

    const mode = getGuardStripeMode()

    if (mode === 'test' && !/^(sk_test_|rk_test_)/.test(key)) {
      throw new Error('Modalita Test con chiave Stripe non Test')
    }

    if (mode === 'live' && !/^(sk_live_|rk_live_)/.test(key)) {
      throw new Error('Modalita Live con chiave Stripe non Live')
    }
    stripe = new Stripe(key)
  }

  return stripe
}

router.post('/link', async (req, res) => {
  // In Sandbox non utilizzare il Supabase condiviso.
  if (getGuardStripeMode() === 'test') {
    return res.status(503).json({
      error: 'Checkout Sandbox in preparazione'
    })
  }
  try {
    const token = req.headers.authorization
      ?.match(/^Bearer\s+(.+)$/i)?.[1]

    if (!token) {
      return res.status(401).json({
        error: 'Accesso richiesto'
      })
    }

    const db = getAdmin()

    // Stripe non riceve il token dell'utente.
    const { data: authData, error: authError } =
      await db.auth.getUser(token)

    const user = authData?.user

    if (authError || !user) {
      return res.status(401).json({
        error: 'Sessione non valida'
      })
    }

    if (!user.email_confirmed_at) {
      return res.status(403).json({
        error: 'Verifica prima la tua email'
      })
    }

    // Accettiamo soltanto profili Guard già collegati
    // in modo verificato all'utente Supabase.
    const { data: profile, error: profileError } =
      await db
        .from('guard_profiles')
        .select('id')
        .eq('auth_user_id', user.id)
        .maybeSingle()

    if (profileError) throw profileError

    if (!profile) {
      return res.status(403).json({
        error: 'Profilo Guard non disponibile'
      })
    }

    const selection = req.body?.selection

    if (
      typeof selection !== 'string' ||
      !Object.prototype.hasOwnProperty.call(LINKS, selection)
    ) {
      return res.status(400).json({
        error: 'Piano non valido'
      })
    }

    const config = LINKS[selection]
    const priceId = process.env[config.priceEnv]?.trim()
    const plan = getGuardPlanFromPrice(priceId)

    if (!plan) {
      throw new Error('Prezzo Guard non configurato')
    }

    // Limite di sicurezza: massimo 10 tentativi
    // di creazione link nell'ultima ora.
    const since = new Date(
      Date.now() - 60 * 60 * 1000
    ).toISOString()

    const { count, error: countError } = await db
      .from('guard_checkout_intents')
      .select('id', { count: 'exact', head: true })
      .eq('auth_user_id', user.id)
      .gte('created_at', since)

    if (countError) throw countError

    if ((count ?? 0) >= 10) {
      return res.status(429).json({
        error: 'Troppi tentativi. Riprova più tardi.'
      })
    }

    const api = getStripe()
    const paymentLink =
      await api.paymentLinks.retrieve(config.linkId)

    if (!paymentLink.active || !paymentLink.url) {
      return res.status(503).json({
        error: 'Piano temporaneamente non disponibile'
      })
    }

    // Controlliamo che il link Stripe non sia stato
    // riconfigurato con un prezzo differente.
    const lines = await api.paymentLinks.listLineItems(
      config.linkId,
      { limit: 10 }
    )

    if (
      lines.has_more ||
      lines.data.length !== 1 ||
      lines.data[0]?.price?.id !== priceId ||
      lines.data[0]?.price?.recurring?.interval !== plan.interval
    ) {
      throw new Error('Configurazione Payment Link non coerente')
    }

    // L'identificativo casuale viene creato
    // da Supabase, non dal browser.
    const { data: intent, error: insertError } =
      await db
        .from('guard_checkout_intents')
        .insert({
          auth_user_id: user.id,
          stripe_price_id: priceId,
          stripe_payment_link_id: config.linkId
        })
        .select('id')
        .single()

    if (insertError) throw insertError

    // Il client_reference_id consentirà al webhook
    // di risalire alla richiesta di acquisto.
    const url = new URL(paymentLink.url)
    url.searchParams.set(
      'client_reference_id',
      intent.id
    )

    return res.json({
      checkout_url: url.toString(),
      plan: plan.plan,
      interval: plan.interval
    })

  } catch (error) {
    console.error(
      '[Guard Checkout] Errore:',
      error.message
    )

    return res.status(503).json({
      error: 'Acquisto temporaneamente non disponibile'
    })
  }
})

export default router
