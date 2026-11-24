
import { createClient } from '@supabase/supabase-js'

// Il server di staging deve potersi avviare anche
// senza credenziali Supabase.
// Le richieste di autenticazione restano disabilitate
// quando Supabase non e' configurato.

let supabaseGuard
function getAuthClient() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY
  if (!supabaseUrl || !supabaseKey) return null
  if (!supabaseGuard) supabaseGuard = createClient(supabaseUrl, supabaseKey, {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
          detectSessionInUrl: false
        }
      })
  return supabaseGuard
}

export async function verifyGuardToken(accessToken) {
  const supabaseGuard = getAuthClient()
  if (
    !supabaseGuard ||
    typeof accessToken !== 'string' ||
    !accessToken
  ) {
    return null
  }

  const { data, error } =
    await supabaseGuard.auth.getUser(accessToken)

  if (error || !data?.user) {
    return null
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null,
    email_confirmed_at:
      data.user.email_confirmed_at ?? null
  }
}
