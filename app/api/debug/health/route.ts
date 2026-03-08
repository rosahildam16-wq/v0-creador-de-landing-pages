/**
 * GET /api/debug/health
 *
 * Simple liveness + DB reachability check.
 * Intentionally lightweight: no auth required (monitoring tools call this).
 * Does NOT expose sensitive env values.
 */

import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const db = createAdminClient()

  // DB connectivity check via a fast table existence probe
  let dbStatus: "connected" | "unreachable" | "misconfigured" = "misconfigured"
  let schemaCache: Record<string, "ok" | "missing"> = {}
  let dbError: string | undefined

  if (!db) {
    dbStatus = "misconfigured"
    dbError = "NEXT_PUBLIC_SUPABASE_URL or key not set"
  } else {
    try {
      // Probe critical tables
      const CRITICAL = ["admin_roles", "communities", "community_members"] as const

      const probes = await Promise.all(
        CRITICAL.map(async (table) => {
          const { error } = await db
            .from(table)
            .select("id", { count: "exact", head: true })
          const missing =
            error?.code === "PGRST200" ||
            error?.message?.toLowerCase().includes("not found") ||
            error?.message?.toLowerCase().includes("schema cache")
          return { table, ok: !missing } as { table: string; ok: boolean }
        })
      )

      probes.forEach(({ table, ok }) => {
        schemaCache[table] = ok ? "ok" : "missing"
      })

      const anyMissing = probes.some((p) => !p.ok)
      dbStatus = anyMissing ? "unreachable" : "connected"
    } catch (e) {
      dbStatus = "unreachable"
      dbError = e instanceof Error ? e.message : String(e)
    }
  }

  const ok = dbStatus === "connected"

  return NextResponse.json(
    {
      ok,
      timestamp: new Date().toISOString(),
      db: dbStatus,
      schema_cache: schemaCache,
      ...(dbError ? { error: dbError } : {}),
    },
    { status: ok ? 200 : 503 }
  )
}
