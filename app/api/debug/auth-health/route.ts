/**
 * GET /api/debug/auth-health
 *
 * Diagnostic endpoint — ONLY available in development or when
 * X-DEBUG-SECRET header matches DEBUG_SECRET env var.
 *
 * Returns:
 *  - env var presence (never values)
 *  - which Supabase key is in use (service_role vs anon fallback)
 *  - auth.users count (via auth.admin API)
 *  - existence of key tables (admin_roles, audit_logs, communities, platform_plans)
 */

import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const DEBUG_SECRET =
  process.env.DEBUG_SECRET || process.env.NEXT_PUBLIC_DEBUG_SECRET || ""

export async function GET(req: NextRequest) {
  // ── Guard ──────────────────────────────────────────────────────────────────
  const isProd = process.env.NODE_ENV === "production"
  const secret = req.headers.get("x-debug-secret") ?? ""

  if (isProd && (!DEBUG_SECRET || secret !== DEBUG_SECRET)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  // ── Env vars (presence only) ───────────────────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const keyInUse = hasServiceKey
    ? "service_role"
    : hasAnonKey
    ? "anon_fallback ⚠️"
    : "none ❌"

  const env = {
    NODE_ENV: process.env.NODE_ENV,
    supabase_url_set: !!supabaseUrl,
    supabase_url_prefix: supabaseUrl ? supabaseUrl.slice(0, 40) + "…" : "NOT SET",
    service_role_key_set: hasServiceKey,
    anon_key_set: hasAnonKey,
    key_in_use: keyInUse,
    jwt_secret_set: !!process.env.JWT_SECRET,
    super_admin_email_env:
      process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL ?? "(not set — using default)",
    debug_secret_set: !!DEBUG_SECRET,
  }

  const db = createAdminClient()
  if (!db) {
    return NextResponse.json(
      { ok: false, env, error: "createAdminClient() returned null — Supabase not configured" },
      { status: 500 }
    )
  }

  // ── auth.users count (Supabase Admin API) ─────────────────────────────────
  let authUsers: number | string = "n/a"
  try {
    const { data, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (error) {
      authUsers = `error: ${error.message}`
    } else {
      // listUsers doesn't expose total directly — fetch page 1 of 1000 as proxy
      const { data: allData, error: allErr } = await db.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })
      if (allErr) authUsers = `error: ${allErr.message}`
      else authUsers = allData?.users?.length ?? 0
    }
  } catch (e) {
    authUsers = `exception: ${e instanceof Error ? e.message : String(e)}`
  }

  // ── Table existence checks ────────────────────────────────────────────────
  const TABLES = [
    "admin_roles",
    "audit_logs",
    "communities",
    "platform_plans",
    "community_members",
    "subscriptions",
  ] as const

  const tables: Record<string, string> = {}
  for (const table of TABLES) {
    const { error } = await db
      .from(table)
      .select("id", { count: "exact", head: true })

    if (!error) {
      tables[table] = "✅ exists"
    } else if (
      error.code === "PGRST200" ||
      error.message?.toLowerCase().includes("not found") ||
      error.message?.toLowerCase().includes("schema cache")
    ) {
      tables[table] = `❌ NOT IN SCHEMA CACHE — ${error.code}: ${error.message}`
    } else if (error.code === "42P01") {
      tables[table] = `❌ DOES NOT EXIST (42P01)`
    } else {
      // RLS deny-all is expected for anon — table exists
      tables[table] = `⚠️ accessible (${error.code}: ${error.message})`
    }
  }

  // ── Schema / DB (via simple rpc probe) ────────────────────────────────────
  let schemaInfo: unknown = "n/a"
  try {
    // current_database() is a built-in Postgres function exposed via rpc
    const { data, error } = await (db as ReturnType<typeof createAdminClient>)!.rpc(
      "current_database" as never
    )
    schemaInfo = error ? `rpc error: ${error.message}` : data
  } catch {
    schemaInfo = "rpc not available"
  }

  // ── Assemble response ──────────────────────────────────────────────────────
  const isHealthy =
    hasServiceKey &&
    !!supabaseUrl &&
    typeof authUsers === "number" &&
    tables["admin_roles"]?.startsWith("✅")

  return NextResponse.json(
    {
      ok: isHealthy,
      timestamp: new Date().toISOString(),
      env,
      database: schemaInfo,
      auth_users_count: authUsers,
      tables,
      notes: [
        hasServiceKey
          ? "✅ SUPABASE_SERVICE_ROLE_KEY is set — service role bypasses RLS"
          : "⚠️  SUPABASE_SERVICE_ROLE_KEY missing — using ANON key. " +
            "Tables with USING(false) policies will appear missing in schema cache. " +
            "Fix: set SUPABASE_SERVICE_ROLE_KEY and run scripts/025_fix_admin_roles_grants.sql",
        typeof authUsers === "number" && authUsers === 0
          ? "⚠️  auth.users is empty. App uses custom JWT (mf_session cookie), " +
            "not Supabase Auth for login. admin_roles.user_id = email or memberId."
          : "",
      ].filter(Boolean),
    },
    { status: isHealthy ? 200 : 207 }
  )
}
