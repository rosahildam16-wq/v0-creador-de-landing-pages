import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, requireRole } from "@/lib/server/admin-guard"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Only super_admin and compliance_admin can read full audit logs
const ALLOWED: Parameters<typeof requireRole>[1] = ["super_admin", "compliance_admin"]

/**
 * GET /api/admin/audit
 * Query params:
 *   actor    — filter by actor_user_id (partial match)
 *   action   — filter by action_type (exact match)
 *   from     — ISO date start
 *   to       — ISO date end
 *   limit    — default 100, max 500
 *   offset   — pagination offset
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ALLOWED)
  if (!roleCheck.ok) return roleCheck.response

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })
  }

  const { searchParams } = new URL(request.url)
  const actor  = searchParams.get("actor")  || undefined
  const action = searchParams.get("action") || undefined
  const from   = searchParams.get("from")   || undefined
  const to     = searchParams.get("to")     || undefined
  const limit  = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500)
  const offset = parseInt(searchParams.get("offset") || "0", 10)

  try {
    let query = supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .order("timestamp", { ascending: false })
      .range(offset, offset + limit - 1)

    if (actor)  query = query.ilike("actor_user_id", `%${actor}%`)
    if (action) query = query.eq("action_type", action)
    if (from)   query = query.gte("timestamp", from)
    if (to)     query = query.lte("timestamp", to)

    const { data, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      logs:   data ?? [],
      total:  count ?? 0,
      limit,
      offset,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido"
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
