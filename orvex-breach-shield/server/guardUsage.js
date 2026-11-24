
import { createClient } from '@supabase/supabase-js'

let usageClient = null

function getUsageClient() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return null
  }

  if (!usageClient) {
    usageClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    })
  }

  return usageClient
}

// Incrementa atomicamente il contatore giornaliero.
// Da richiamare soltanto dopo avere identificato
// l'utente o l'ospite in modo sicuro.
export async function consumeGuardUsage(principalKey, dailyLimit) {
  const client = getUsageClient()

  if (!client) {
    return {
      allowed: false,
      error: 'Contatore giornaliero non configurato',
    }
  }

  if (
    typeof principalKey !== 'string' ||
    principalKey.length < 10 ||
    principalKey.length > 200 ||
    ![2, 3].includes(dailyLimit)
  ) {
    return {
      allowed: false,
      error: 'Parametri del contatore non validi',
    }
  }

  const { data, error } = await client.rpc(
    'guard_consume_daily_usage',
    {
      p_principal_key: principalKey,
      p_daily_limit: dailyLimit,
    }
  )

  if (error) {
    return {
      allowed: false,
      error: 'Errore del contatore giornaliero',
    }
  }

  if (data === null) {
    return {
      allowed: false,
      remaining: 0,
      error: 'Limite giornaliero raggiunto',
    }
  }

  return {
    allowed: true,
    remaining: dailyLimit - data,
  }
}
