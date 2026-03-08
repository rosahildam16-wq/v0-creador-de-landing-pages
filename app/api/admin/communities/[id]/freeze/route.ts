import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, requireRole, getRequestMeta, getActorId } from "@/lib/server/admin-guard"
import { logAuditEvent } from "@/lib/server/audit"
import { createAdminClient } from "@/lib/supabase/admin"
import type { AdminRole } from "@/lib/server/admin-guard"

export const dynamic = "force-dynamic"

const ALLOWED: AdminRole[] = ["super_admin", "admin", "compliance_admin"]

/**
 * POST /api/admin/communities/[id]/freeze
 * Body: { action: "freeze" | "unfreeze", reason?: string }
 *
 * Sets the community status to "frozen" or back to "active".
 * Audit logged for both actions.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ALLOWED)
  if (!roleCheck.ok) return roleCheck.response

  let body: { action?: "freeze" | "unfreeze"; reason?: string }
  try { body = await request.json() }
  catch { return NextResponse.json({ error: "JSON inválido" }, { status: 400 }) }

  if (!body.action) {
    return NextResponse.json({ error: "Se requiere: action (freeze | unfreeze)" }, { status: 400 })
  }
  if (body.action === "freeze" && !body.reason?.trim()) {
    return NextResponse.json({ error: "Se requiere motivo para congelar la comunidad" }, { status: 400 })
  }

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

  const isFreezing = body.action === "freeze"

  const { error } = await db
    .from("communities")
    .update({ status: isFreezing ? "frozen" : "active" })
    .eq("id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  void logAuditEvent({
    actor_user_id: getActorId(guard.user),
    actor_role:    guard.user.role,
    action_type:   isFreezing ? "freeze_community" : "unfreeze_community",
    target_type:   "community",
    target_id:     params.id,
    reason:        body.reason,
    ...getRequestMeta(request),
  })

  return NextResponse.json({ ok: true })
}
