import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, requireRole, getRequestMeta, getActorId } from "@/lib/server/admin-guard"
import { logAuditEvent } from "@/lib/server/audit"
import { createAdminClient } from "@/lib/supabase/admin"
import type { AdminRole } from "@/lib/server/admin-guard"

export const dynamic = "force-dynamic"

// super_admin + admin (platform_admin) can freeze/unfreeze accounts
const ALLOWED: AdminRole[] = ["super_admin", "admin", "compliance_admin"]

/**
 * POST /api/admin/users/[id]/freeze
 * Body: { action: "freeze" | "unfreeze", reason: string }
 *
 * Sets frozen_at on community_members to indicate the account is suspended.
 * frozen_at = ISO timestamp → frozen; frozen_at = null → active.
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
    return NextResponse.json({ error: "Se requiere motivo para congelar una cuenta" }, { status: 400 })
  }

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

  const isFreezing = body.action === "freeze"
  const now = new Date().toISOString()

  const { error } = await db
    .from("community_members")
    .update({
      frozen_at: isFreezing ? now : null,
      updated_at: now,
    })
    .eq("member_id", params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const actorId = getActorId(guard.user)
  void logAuditEvent({
    actor_user_id: actorId,
    actor_role:    guard.user.role,
    action_type:   isFreezing ? "freeze_account" : "unfreeze_account",
    target_type:   "user",
    target_id:     params.id,
    reason:        body.reason,
    ...getRequestMeta(request),
  })

  return NextResponse.json({ ok: true })
}
