import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, requireRole, getRequestMeta, getActorId } from "@/lib/server/admin-guard"
import { logAuditEvent } from "@/lib/server/audit"
import { createAdminClient } from "@/lib/supabase/admin"
import { normalizePlanCode, type PlanCode } from "@/lib/plans"

const VALID_PLAN_CODES: PlanCode[] = ["27", "47", "97", "300"]

/**
 * PATCH /api/admin/users/plan
 * Body: { userId: number, planCode: "27"|"47"|"97"|"300" }
 *
 * Updates plan_code in community_members.
 * The next time the user calls /api/auth/me, their session planCode is refreshed
 * automatically — no re-login required.
 *
 * Only super_admin can change plans.
 */
export async function PATCH(req: NextRequest) {
  const guard = await requireAdminSession(req)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ["super_admin"])
  if (!roleCheck.ok) return roleCheck.response

  try {
    const body = await req.json()
    const { userId, planCode } = body as { userId: number; planCode: string }

    if (!userId) {
      return NextResponse.json({ error: "userId requerido" }, { status: 400 })
    }

    const normalized = normalizePlanCode(planCode)
    if (!VALID_PLAN_CODES.includes(normalized)) {
      return NextResponse.json(
        { error: `Plan inválido. Opciones: ${VALID_PLAN_CODES.join(", ")}` },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()
    if (!supabase) {
      return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })
    }

    // Fetch user info before update (for audit log + username return)
    const { data: existing } = await supabase
      .from("community_members")
      .select("id, member_id, name, email, username, plan_code")
      .eq("id", userId)
      .single()

    if (!existing) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const previousPlan = (existing.plan_code as string | null) ?? "27"

    const { error } = await supabase
      .from("community_members")
      .update({ plan_code: normalized })
      .eq("id", userId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    void logAuditEvent({
      actor_user_id: getActorId(guard.user),
      actor_role:    guard.user.role,
      action_type:   "user.plan_upgrade",
      target_type:   "user",
      target_id:     String(userId),
      payload:       {
        email:        existing.email,
        name:         existing.name,
        previous_plan: previousPlan,
        new_plan:     normalized,
      },
      ...getRequestMeta(req),
    })

    return NextResponse.json({
      success: true,
      userId,
      planCode: normalized,
      message: `Plan de ${existing.name} actualizado de ${previousPlan} → ${normalized}`,
    })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
