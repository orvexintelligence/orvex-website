
import { createClient } from '@supabase/supabase-js'

// Configurazione Supabase caricata dalle variabili locali.
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Configurazione Supabase Guard mancante')
}

// Client senza privilegi amministrativi.
// Non utilizza service_role o secret key.
export const supabaseGuard = createClient(
  supabaseUrl,
  supabaseKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  }
)

// Verifica un access token Supabase Auth.
// Non modifica utenti o profili.
export async function verifyGuardToken(accessToken) {
  if (typeof accessToken !== 'string' || !accessToken) {
    return null
  }

  const { data, error } = await supabaseGuard.auth.getUser(accessToken)

  if (error || !data?.user) {
    return null
  }

  return {
    id: data.user.id,
    email: data.user.email ?? null,
  }
}
