
import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { verifyGuardToken } from '../supabaseGuard.js'

const router = Router()

// Lettura del profilo protetta da Supabase Auth e RLS.
router.get('/', async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || ''
    const match = authorization.match(/^Bearer\s+(.+)$/i)

    if (!match) {
      return res.status(401).json({
        error: 'Autenticazione richiesta'
      })
    }

    const token = match[1].trim()
    const user = await verifyGuardToken(token)

    if (!user) {
      return res.status(401).json({
        error: 'Token non valido o scaduto'
      })
    }

    // Utilizza la Publishable key e il token verificato.
    // Non utilizza la chiave service_role.
    const supabase = createClient(
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

export default router
