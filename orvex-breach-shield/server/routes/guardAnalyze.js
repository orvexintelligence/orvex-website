
import { Router } from 'express'
import { createClient } from '@supabase/supabase-js'
import { extractUrl, analyzeUrlFeatures } from '../guardAnalysis.js'
import { analyzeGuardTextWithAI, isGuardAIConfigured } from '../guardOpenAI.js'
import { verifyGuardToken } from '../supabaseGuard.js'
import { getGuardGuestKey } from '../guardGuest.js'

export function createGuardAnalyzeRouter(deps = {}) {
const router = Router()

let supabaseAdmin

function getAdmin() {
  if (deps.admin) return deps.admin
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
      throw new Error('Supabase non configurato')
    }

    supabaseAdmin = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      }
    })
  }

  return supabaseAdmin
}

function readLimit(name, fallback) {
  const value = Number(process.env[name])

  return Number.isInteger(value) &&
    value >= 1 &&
    value <= 200
    ? value
    : fallback
}

const aiEnabled = () =>
  process.env.GUARD_AI_ENABLED === 'true' &&
  (deps.isAIConfigured ?? isGuardAIConfigured)()

async function consumeUsage(principalKey, limit) {
  const { data, error } = await getAdmin().rpc(
    'guard_consume_daily_usage_v2',
    {
      p_principal_key: principalKey,
      p_limit: limit
    }
  )

  if (error) {
    console.error('[Guard Usage] Contatore:', error.message)
    return {
      allowed: false,
      error: 'Controllo disponibilita non riuscito'
    }
  }

  return data
}

async function getVerifiedPlan(userId) {
  if (!userId) return 'guest'

  // Non fidarsi del piano dichiarato dal browser
  // o del solo campo guard_profiles.plan.
  // Verificare i diritti pagati lato server.
  const { data, error } = await getAdmin()
    .from('guard_stripe_subscriptions')
    .select('plan, status, paid_through')
    .eq('auth_user_id', userId)
    .in('status', ['active', 'past_due'])
    .gt('paid_through', new Date().toISOString())

  if (error) {
    throw new Error(
      'Impossibile verificare abbonamento Guard'
    )
  }

  const plans = (data ?? []).map(row => row.plan)

  if (plans.includes('small_b2b')) return 'small_b2b'
  if (plans.includes('premium')) return 'premium'

  return 'free'
}

function dailyLimitForPlan(plan) {
  switch (plan) {
    case 'guest':
      return 2
    case 'premium':
      return readLimit('GUARD_PREMIUM_DAILY_LIMIT', 10)
    case 'small_b2b':
      return readLimit('GUARD_SMALL_B2B_DAILY_LIMIT', 20)
    default:
      return 3
  }
}

function limitResponse(res, usage) {
  const reached =
    usage?.error === 'Limite giornaliero raggiunto'

  return res.status(reached ? 429 : 503).json({
    error: reached
      ? 'Limite giornaliero raggiunto'
      : 'Controllo disponibilita non riuscito',
    upgradeRequired: reached
  })
}

router.post('/text', async (req, res, next) => {
  try {
    const { text } = req.body ?? {}

    if (typeof text !== 'string' || !text.trim()) {
      return res.status(400).json({
        error: 'Testo mancante'
      })
    }

    if (text.length > 4000) {
      return res.status(413).json({
        error: 'Testo troppo lungo (massimo 4000 caratteri)'
      })
    }

    let user = null
    const authorization = req.headers.authorization || ''

    if (authorization) {
      const match = authorization.match(/^Bearer\s+(.+)$/i)

      if (!match) {
        return res.status(401).json({
          error: 'Autenticazione non valida'
        })
      }

      user = await (deps.verifyToken ?? verifyGuardToken)(match[1].trim())

      if (!user) {
        return res.status(401).json({
          error: 'Token non valido o scaduto'
        })
      }
      if (!user.email_confirmed_at) {
        return res.status(403).json({ error: 'Conferma email richiesta' })
      }
    }

    const cleanText = text.trim()
    const url = extractUrl(cleanText)
    const useAI = aiEnabled()

    if (!url && !useAI) {
      return res.status(503).json({
        error: 'Analisi AI temporaneamente non disponibile'
      })
    }

    // Non abilitare gli ospiti in produzione
    // prima di verificare la configurazione proxy.
    if (
      !user &&
      process.env.NODE_ENV === 'production' &&
      process.env.GUARD_GUEST_IP_VERIFIED !== 'true'
    ) {
      return res.status(503).json({
        error: 'Analisi ospiti temporaneamente non disponibile'
      })
    }

    const plan = await getVerifiedPlan(user?.id)
    const dailyLimit = dailyLimitForPlan(plan)

    const principalKey = user
      ? `user:${user.id}`
      : getGuardGuestKey(req)

    const usage = await consumeUsage(
      principalKey,
      dailyLimit
    )

    if (!usage?.allowed) {
      return limitResponse(res, usage)
    }

    if (!useAI) {
      return res.json({
        ...analyzeUrlFeatures(url),
        analyzedUrl: url,
        preliminary: true,
        usageLimitsActive: true,
        plan,
        remaining: usage.remaining
      })
    }

    // Tetto globale OpenAI configurabile.
    // Usiamo un contatore dedicato alla nuova versione.
    const globalLimit = readLimit(
      'GUARD_AI_DAILY_CAP',
      20
    )

    const globalUsage = await consumeUsage(
      'system:guard-ai:v2',
      globalLimit
    )

    if (!globalUsage?.allowed) {
      return res.status(
        globalUsage?.error === 'Limite giornaliero raggiunto'
          ? 429
          : 503
      ).json({
        error: 'Capacita AI giornaliera esaurita o temporaneamente non disponibile'
      })
    }

    let aiResult
    try { aiResult = await (deps.analyzeAI ?? analyzeGuardTextWithAI)(cleanText) }
    catch { return res.status(503).json({ error: 'Analisi AI non disponibile' }) }

    if (
      !aiResult?.available ||
      !aiResult.result ||
      typeof aiResult.result !== 'object'
    ) {
      return res.status(503).json({
        error: 'Analisi AI non disponibile'
      })
    }

    return res.json({
      ...aiResult.result,
      preliminary: false,
      usageLimitsActive: true,
      plan,
      remaining: usage.remaining
    })

  } catch (error) {
    next(error)
  }
})

return router
}
export default createGuardAnalyzeRouter()
