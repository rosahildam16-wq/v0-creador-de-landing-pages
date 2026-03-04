import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/server/admin-guard"
import { markPayoutSent, markPayoutPaid, markPayoutFailed } from "@/lib/server/payouts"
import { logAuditEvent } from "@/lib/server/audit"

export const dynamic = "force-dynamic"

const ALLOWED_ROLES = ["super_admin", "admin", "finance_admin"]

/**
 * PATCH /api/admin/payouts/[id]
 * Updates a payout's status.
 * Requires finance_admin or higher.
 *
 * Body: { status: "sent" | "paid" | "failed", reason? }
 *   - "sent"   → transfer initiated
 *   - "paid"   → transfer confirmed, paid_at = now
 *   - "failed" → transfer failed (reason stored in notes)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  if (!ALLOWED_ROLES.includes(guard.user.role)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  let body: { status?: "sent" | "paid" | "failed"; reason?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  if (!body.status) {
    return NextResponse.json({ error: "Se requiere: status" }, { status: 400 })
  }

  switch (body.status) {
    case "sent":
      await markPayoutSent(params.id)
      break
    case "paid":
      await markPayoutPaid(params.id)
      break
    case "failed":
      if (!body.reason) {
        return NextResponse.json({ error: "Se requiere: reason para status=failed" }, { status: 400 })
      }
      await markPayoutFailed(params.id, body.reason)
      break
    default:
      return NextResponse.json({ error: "Status inválido. Use: sent, paid, failed" }, { status: 400 })
  }

  await logAuditEvent({
    actor_user_id: guard.user.memberId as string ?? guard.user.email as string,
    actor_role: guard.user.role,
    action_type: `payout.${body.status}`,
    target_type: "payout",
    target_id: params.id,
    reason: body.reason,
    ip: request.headers.get("x-forwarded-for") ?? undefined,
    user_agent: request.headers.get("user-agent") ?? undefined,
  })

  return NextResponse.json({ success: true })
}
