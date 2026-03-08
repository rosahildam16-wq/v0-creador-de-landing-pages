import { NextRequest, NextResponse } from "next/server"
import {
  requireAdminSession,
  requireRole,
  getActorId,
  getRequestMeta,
  type AdminRole,
} from "@/lib/server/admin-guard"
import { logAuditEvent } from "@/lib/server/audit"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const ALLOWED: AdminRole[] = ["super_admin"]

/**
 * DELETE /api/admin/roles/[id]
 * Revokes an admin role (soft delete: sets active=false, revoked_at, revoked_by).
 * super_admin only. Cannot self-revoke.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ALLOWED)
  if (!roleCheck.ok) return roleCheck.response

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

  const actorId = getActorId(guard.user)
  const meta = getRequestMeta(request)
  const roleId = params.id

  if (!roleId) {
    return NextResponse.json({ error: "ID requerido" }, { status: 400 })
  }

  // Fetch the role record
  const { data: record } = await db
    .from("admin_roles")
    .select("id, user_id, role, active")
    .eq("id", roleId)
    .maybeSingle()

  if (!record) {
    return NextResponse.json({ error: "Rol no encontrado" }, { status: 404 })
  }

  if (!record.active) {
    return NextResponse.json({ error: "El rol ya está revocado" }, { status: 409 })
  }

  // Prevent self-revocation
  if (record.user_id === actorId) {
    return NextResponse.json(
      { error: "No puedes revocar tu propio rol de administrador" },
      { status: 422 }
    )
  }

  const { error: updateError } = await db
    .from("admin_roles")
    .update({
      active: false,
      revoked_at: new Date().toISOString(),
      revoked_by: actorId,
    })
    .eq("id", roleId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  void logAuditEvent({
    actor_user_id: actorId,
    actor_role: guard.user.role,
    action_type: "revoke_role",
    target_type: "user",
    target_id: record.user_id,
    payload: { revoked_role: record.role, role_id: roleId },
    ...meta,
  })

  return NextResponse.json({ ok: true })
}
