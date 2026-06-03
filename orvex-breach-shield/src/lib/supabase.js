import { createClient } from '@supabase/supabase-js'

// ─────────────────────────────────────────────────────────────────
//  Supabase client — singleton condiviso in tutta l'app
//
//  Le variabili d'ambiente VITE_SUPABASE_* sono definite in .env.local
//  e accessibili nel bundle via import.meta.env.
// ─────────────────────────────────────────────────────────────────

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Orvex] Supabase non configurato — imposta VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY in .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey)
