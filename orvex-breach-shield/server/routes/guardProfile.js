
import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { verifyGuardToken } from '../supabaseGuard.js'
import { claimGuardPurchases } from '../guardDirectPurchase.js'

export function createGuardProfileRouter(deps = {}) {
const router = Router()
const verifyToken = deps.verifyToken ?? verifyGuardToken

function getBearerToken(req) {
  const authorization = req.headers.authorization || ''
  const match = authorization.match(/^Bearer\s+(.+)$/i)
  return match ? match[1].trim() : null
}

function createUserClient(token) {
  if (deps.createUserClient) return deps.createUserClient(token)
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_PUBLISHABLE_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    }
  )
}

// Solo backend: non esporre mai questa chiave al frontend.
function createAdminClient() {
  if (deps.admin) return deps.admin
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY non configurata')
  }

  return createClient(
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

// Lettura protetta del proprio profilo.
// Usa il token utente e le policy RLS di Supabase.
router.get('/', async (req, res, next) => {
  try {
    const token = getBearerToken(req)

    if (!token) {
      return res.status(401).json({
        error: 'Autenticazione richiesta'
      })
    }

    const user = await verifyToken(token)

    if (!user) {
      return res.status(401).json({
        error: 'Token non valido o scaduto'
      })
    }

    await claimGuardPurchases(createAdminClient(), user)
    const supabase = createUserClient(token)

    const { data, error } = await supabase
      .from('guard_profiles')
      .select(
        'auth_user_id, email, name, account_type, plan, created_at'
      )
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (error) {
      return res.status(503).json({
        error: 'Impossibile leggere il profilo'
      })
    }

    if (!data) {
      return res.status(404).json({
        error: 'Profilo Orvex Guard non ancora associato',
        profileLinked: false
      })
    }

    return res.json({
      userId: user.id,
      email: data.email,
      name: data.name,
      type: data.account_type,
      plan: data.plan,
      createdAt: data.created_at,
      profileLinked: true
    })
  } catch (error) {
    next(error)
  }
})

// Creazione esplicita del profilo Guard per nuovi iscritti.
// Non associa i profili storici AWS in base alla sola email.
router.post('/initialize', async (req, res, next) => {
  try {
    const token = getBearerToken(req)

    if (!token) {
      return res.status(401).json({
        error: 'Autenticazione richiesta'
      })
    }

    const user = await verifyToken(token)

    if (!user) {
      return res.status(401).json({
        error: 'Token non valido o scaduto'
      })
    }

    if (!user.email || !user.email_confirmed_at) {
      return res.status(403).json({
        error: 'Conferma email richiesta'
      })
    }

    const email = user.email.trim().toLowerCase()
    const nameInput = req.body?.name

    if (
      nameInput !== undefined &&
      (typeof nameInput !== 'string' ||
        nameInput.trim().length > 100)
    ) {
      return res.status(400).json({
        error: 'Nome non valido'
      })
    }

    const admin = createAdminClient()

    // Se l'utente possiede già un profilo Guard, non crearne un altro.
    const { data: existingProfile, error: existingError } = await admin
      .from('guard_profiles')
      .select('id, plan')
      .eq('auth_user_id', user.id)
      .maybeSingle()

    if (existingError) {
      return res.status(503).json({
        error: 'Verifica del profilo non riuscita'
      })
    }

    if (existingProfile) {
      return res.json({
        message: 'Profilo già presente',
        profileLinked: true,
        plan: existingProfile.plan
      })
    }

    // Protezione dei vecchi account importati da AWS.
    const { data: legacyProfiles, error: legacyError } = await admin
      .from('guard_profiles')
      .select('id')
      .eq('email', email)
      .not('aws_user_id', 'is', null)
      .limit(1)

    if (legacyError) {
      return res.status(503).json({
        error: 'Verifica degli account storici non riuscita'
      })
    }

    if (legacyProfiles?.length) {
      return res.status(409).json({
        error: 'Account Guard storico: recupero verificato necessario',
        profileLinked: false
      })
    }

    const name = typeof nameInput === 'string'
      ? nameInput.trim()
      : ''

    // Il piano viene imposto dal server.
    // Non accettiamo plan, activated o auth_user_id dal client.
    const { error: insertError } = await admin
      .from('guard_profiles')
      .insert({
        auth_user_id: user.id,
        aws_user_id: null,
        email,
        name,
        account_type: 'personal',
        plan: 'free',
        actived: true,
        analyses_today: 0,
        last_analysis_date: null
      })

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({
          error: 'Profilo già presente o creazione in conflitto'
        })
      }

      return res.status(503).json({
        error: 'Creazione del profilo non riuscita'
      })
    }

    return res.status(201).json({
      message: 'Profilo Orvex Guard creato',
      profileLinked: true,
      plan: 'free'
    })
  } catch (error) {
    next(error)
  }
})

return router
}
export default createGuardProfileRouter()
