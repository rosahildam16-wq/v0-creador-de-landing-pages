import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Admin/service Supabase client that does NOT depend on cookies.
 * Use this in API routes and server-side data functions
 * where cookie-based auth is not needed (CRM has its own auth layer).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key) {
    throw new Error(
      "Supabase no esta configurado. Agrega la integracion de Supabase desde el panel lateral de v0 (seccion Connect)."
    )
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  })
}
