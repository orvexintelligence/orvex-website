
import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { verifyGuardToken } from '../supabaseGuard.js'

const router = Router()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY

function createAuthClient() {
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })
}

// Controllo dello stato del backend.
router.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Orvex Guard API',
    environment: 'migration-test',
  })
})

// Registrazione tramite Supabase Auth.
// Non collega automaticamente i profili importati da AWS.
router.post('/register', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {}

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.includes('@') ||
      password.length < 8 ||
      password.length > 128
    ) {
      return res.status(400).json({
        error: 'Email o password non valida. Minimo 8 caratteri.',
      })
    }

    const supabase = createAuthClient()

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    })

    if (error) {
      return res.status(400).json({
        error: 'Registrazione non riuscita',
      })
    }

    return res.status(202).json({
      message: 'Controlla la tua email per completare la registrazione.',
    })
  } catch (error) {
    next(error)
  }
})

// Login tramite Supabase Auth.
// Non usa le vecchie password o i token AWS.
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body ?? {}

    if (
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !email.includes('@') ||
      !password
    ) {
      return res.status(400).json({
        error: 'Email o password non valida',
      })
    }

    const supabase = createAuthClient()

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (error || !data?.session?.access_token) {
      return res.status(401).json({
        error: 'Credenziali non valide o email non confermata',
      })
    }

    return res.json({
      access_token: data.session.access_token,
      expires_at: data.session.expires_at,
      token_type: data.session.token_type,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    })
  } catch (error) {
    next(error)
  }
})

// Endpoint protetto: verifica il token dell'utente.
// Non legge i profili AWS importati.
router.get('/me', async (req, res, next) => {
  try {
    const authorization = req.headers.authorization || ''
    const match = authorization.match(/^Bearer\s+(.+)$/i)

    if (!match) {
      return res.status(401).json({
        error: 'Authentication required',
      })
    }

    const user = await verifyGuardToken(match[1].trim())

    if (!user) {
      return res.status(401).json({
        error: 'Invalid or expired token',
      })
    }

    return res.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
      },
    })
  } catch (error) {
    next(error)
  }
})

export default router
