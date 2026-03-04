import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, requireRole, getActorId, getRequestMeta } from "@/lib/server/admin-guard"
import { verifyTOTP } from "@/lib/server/totp"
import { logAuditEvent } from "@/lib/server/audit"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/**
 * POST /api/auth/2fa/disable
 * Body: { code: string }
 *
 * Disables 2FA for the current admin user.
 * Requires a valid TOTP code to confirm (prevents disabling via stolen session).
 * Only super_admin can disable their own 2FA.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  // Only super_admin can disable their own 2FA (others must contact super_admin)
  const roleCheck = requireRole(guard.user.role, ["super_admin"])
  if (!roleCheck.ok) return roleCheck.response

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

  const userId = getActorId(guard.user)
  const meta   = getRequestMeta(request)

  let body: { code?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body.code?.trim()) {
    return NextResponse.json({ error: "Se requiere código TOTP para confirmar" }, { status: 400 })
  }

  const { data: record } = await db
    .from("admin_2fa")
    .select("totp_secret, enabled")
    .eq("user_id", userId)
    .maybeSingle()

  if (!record?.enabled) {
    return NextResponse.json({ error: "2FA no está habilitado" }, { status: 400 })
  }

  if (!verifyTOTP(record.totp_secret, body.code)) {
    return NextResponse.json({ error: "Código TOTP incorrecto" }, { status: 401 })
  }

  await db
    .from("admin_2fa")
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq("user_id", userId)

  void logAuditEvent({
    actor_user_id: userId,
    actor_role:    guard.user.role,
    action_type:   "2fa.disabled",
    target_type:   "user",
    target_id:     userId,
    ...meta,
  })

  return NextResponse.json({ ok: true })
}
