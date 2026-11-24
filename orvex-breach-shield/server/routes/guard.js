import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { verifyGuardToken } from '../supabaseGuard.js'

export function createGuardAuthRouter(deps = {}) {
const router = Router()
const verifyToken = deps.verifyToken ?? verifyGuardToken

function createAuthClient() {
  if (deps.createAuthClient) return deps.createAuthClient()
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}

function bearer(req) {
  return (req.headers.authorization || '').match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null
}

router.get('/health', (_req, res) => res.json({status:'ok', service:'Orvex Guard API', environment:'migration-test'}))

router.post('/register', async (req, res, next) => {
  try {
    const {email, password} = req.body ?? {}
    if (typeof email !== 'string' || typeof password !== 'string' ||
        !email.includes('@') || password.length < 8 || password.length > 128) {
      return res.status(400).json({error:'Email o password non valida. Minimo 8 caratteri.'})
    }
    const supabase = createAuthClient()
    const {error} = await supabase.auth.signUp({email:email.trim(),password})
    if (error) return res.status(400).json({error:'Registrazione non riuscita'})
    return res.status(202).json({message:'Controlla la tua email per completare la registrazione.'})
  } catch (error) { next(error) }
})

function sessionResponse(data) {
  return {
    access_token:data.session.access_token,
    refresh_token:data.session.refresh_token,
    expires_at:data.session.expires_at,
    token_type:data.session.token_type,
    user:{id:data.user.id,email:data.user.email},
  }
}

router.post('/login', async (req, res, next) => {
  try {
    const {email, password} = req.body ?? {}
    if (typeof email !== 'string' || typeof password !== 'string' || !email.includes('@') || !password) {
      return res.status(400).json({error:'Email o password non valida'})
    }
    const {data,error} = await createAuthClient().auth.signInWithPassword({email:email.trim(),password})
    if (error || !data?.session?.access_token) {
      return res.status(401).json({error:'Credenziali non valide o email non confermata'})
    }
    return res.json(sessionResponse(data))
  } catch (error) { next(error) }
})

// For browser sessions expiring after roughly an hour.
router.post('/refresh', async (req, res, next) => {
  try {
    const {refresh_token} = req.body ?? {}
    if (typeof refresh_token !== 'string' || refresh_token.length > 4096 || !refresh_token) {
      return res.status(400).json({error:'Sessione non valida'})
    }
    const {data,error} = await createAuthClient().auth.refreshSession({refresh_token})
    if (error || !data?.session?.access_token || !data?.session?.refresh_token || !data.user) {
      return res.status(401).json({error:'Sessione scaduta. Effettua nuovamente il login.'})
    }
    return res.json(sessionResponse(data))
  } catch (error) { next(error) }
})

router.get('/me', async (req, res, next) => {
  try {
    const token = bearer(req)
    if (!token) return res.status(401).json({error:'Authentication required'})
    const user = await verifyToken(token)
    if (!user) return res.status(401).json({error:'Invalid or expired token'})
    return res.json({authenticated:true, user:{id:user.id,email:user.email}})
  } catch (error) { next(error) }
})

// A password change requires the current password, a valid logged-in JWT,
// and re-authentication for the same Supabase Auth user (not just email match).
router.post('/password', async (req, res, next) => {
  try {
    const token = bearer(req)
    if (!token) return res.status(401).json({error:'Autenticazione richiesta'})
    const user = await verifyToken(token)
    if (!user || !user.email) return res.status(401).json({error:'Sessione non valida'})
    const {currentPassword,newPassword} = req.body ?? {}
    if (typeof currentPassword !== 'string' || !currentPassword ||
        typeof newPassword !== 'string' || newPassword.length < 8 || newPassword.length > 128 ||
        currentPassword === newPassword) {
      return res.status(400).json({error:'Inserisci la password attuale e una nuova password diversa (8-128 caratteri).'})
    }
    const auth = createAuthClient()
    const {data:login,error:loginError} = await auth.auth.signInWithPassword({email:user.email,password:currentPassword})
    if (loginError || login?.user?.id !== user.id || !login?.session) {
      return res.status(401).json({error:'Password attuale non corretta'})
    }
    const {error} = await auth.auth.updateUser({password:newPassword})
    if (error) return res.status(400).json({error:'Password non aggiornata. Verifica le impostazioni di sicurezza di Supabase Auth.'})
    await auth.auth.signOut().catch(()=>{})
    return res.json({message:'Password aggiornata. Effettua nuovamente il login.'})
  } catch (error) { next(error) }
})

return router
}
export default createGuardAuthRouter()
