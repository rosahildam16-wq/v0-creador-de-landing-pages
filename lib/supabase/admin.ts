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
    console.warn(
      "Supabase no esta configurado. Algunas funciones de base de datos estaran deshabilitadas."
    )
    return null
  }

  return createSupabaseClient(url, key, {
    auth: { persistSession: false },
  })
}

