import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, requireRole, getRequestMeta, getActorId } from "@/lib/server/admin-guard"
import { startImpersonation } from "@/lib/server/impersonation"
import { createAdminClient } from "@/lib/supabase/admin"
import type { AdminRole } from "@/lib/server/admin-guard"

export const dynamic = "force-dynamic"

const ALLOWED: AdminRole[] = ["super_admin", "admin"]

// Blocked actions during impersonation — enforced by checking _impersonating flag
// in the relevant endpoints (plan change, payout edit, API keys, etc.)

/**
 * POST /api/admin/impersonate
 * Body: { targetUserId: string, reason: string }
 *
 * Starts an impersonation session:
 *   1. Validates requester is super_admin or admin
 *   2. Requires mandatory reason
 *   3. Blocks self-impersonation
 *   4. Blocks impersonation of another admin
 *   5. Creates impersonation session + audit log
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ALLOWED)
  if (!roleCheck.ok) return roleCheck.response

  let body: { targetUserId?: string; reason?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  if (!body.targetUserId?.trim()) {
    return NextResponse.json({ error: "Se requiere: targetUserId" }, { status: 400 })
  }
  if (!body.reason?.trim()) {
    return NextResponse.json({ error: "Se requiere motivo obligatorio para impersonar" }, { status: 400 })
  }

  const actorId = getActorId(guard.user)

  // Block self-impersonation
  if (body.targetUserId === actorId) {
    return NextResponse.json({ error: "No puedes impersonarte a ti mismo" }, { status: 400 })
  }

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })
  }

  // Look up target user
  const { data: targetMember } = await supabase
    .from("community_members")
    .select("member_id, name, email, username, role, community_id")
    .eq("member_id", body.targetUserId)
    .maybeSingle()

  if (!targetMember) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  // Block impersonation of other admins (only super_admin could, but it's still blocked for security)
  const targetRole = targetMember.role as string
  if (["super_admin", "admin", "finance_admin", "support_admin", "compliance_admin"].includes(targetRole)) {
    return NextResponse.json(
      { error: "No se puede impersonar a otro usuario administrador" },
      { status: 403 }
    )
  }

  const meta = getRequestMeta(request)
  const targetUserData = {
    email:       targetMember.email,
    name:        targetMember.name,
    username:    targetMember.username,
    role:        targetMember.role || "member",
    memberId:    targetMember.member_id,
    communityId: targetMember.community_id,
  }

  await startImpersonation(
    guard.user,
    targetUserData,
    body.reason.trim(),
    meta.ip,
    meta.user_agent
  )

  return NextResponse.json({
    ok: true,
    targetUser: {
      id:    targetMember.member_id,
      name:  targetMember.name,
      email: targetMember.email,
    },
  })
}
