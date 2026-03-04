import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, requireRole, getRequestMeta, getActorId } from "@/lib/server/admin-guard"
import { markPayoutSent, markPayoutPaid, markPayoutFailed } from "@/lib/server/payouts"
import { logAuditEvent } from "@/lib/server/audit"
import type { AdminRole } from "@/lib/server/admin-guard"

export const dynamic = "force-dynamic"

// Access matrix (separation of duties):
//   "sent"   → finance_admin or super_admin (initiate transfer)
//   "paid"   → super_admin ONLY           (final payment confirmation)
//   "failed" → finance_admin or super_admin

const CAN_SEND_OR_FAIL: AdminRole[] = ["super_admin", "finance_admin"]
const CAN_MARK_PAID:    AdminRole[] = ["super_admin"]

/**
 * PATCH /api/admin/payouts/[id]
 * Body: { status: "sent" | "paid" | "failed", reason: string }
 *   - "sent"   → reason optional
 *   - "paid"   → super_admin ONLY; reason MANDATORY (compliance)
 *   - "failed" → reason MANDATORY
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  // Minimum access: finance_admin or super_admin
  const baseCheck = requireRole(guard.user.role, CAN_SEND_OR_FAIL)
  if (!baseCheck.ok) return baseCheck.response

  let body: { status?: "sent" | "paid" | "failed"; reason?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  if (!body.status) {
    return NextResponse.json({ error: "Se requiere: status" }, { status: 400 })
  }

  const meta    = getRequestMeta(request)
  const actorId = getActorId(guard.user)

  switch (body.status) {
    case "sent": {
      await markPayoutSent(params.id)
      break
    }

    case "paid": {
      // Final payment confirmation → super_admin only (separation of duties)
      const paidCheck = requireRole(guard.user.role, CAN_MARK_PAID)
      if (!paidCheck.ok) return paidCheck.response

      // Reason mandatory for compliance audit trail
      if (!body.reason?.trim()) {
        return NextResponse.json(
          { error: "Se requiere motivo (reason) para confirmar pago — compliance" },
          { status: 400 }
        )
      }
      await markPayoutPaid(params.id)
      break
    }

    case "failed": {
      if (!body.reason?.trim()) {
        return NextResponse.json(
          { error: "Se requiere motivo (reason) para marcar como fallido" },
          { status: 400 }
        )
      }
      await markPayoutFailed(params.id, body.reason)
      break
    }

    default:
      return NextResponse.json(
        { error: "Status inválido. Use: sent, paid, failed" },
        { status: 400 }
      )
  }

  await logAuditEvent({
    actor_user_id: actorId,
    actor_role:    guard.user.role,
    action_type:   `payout.${body.status}`,
    target_type:   "payout",
    target_id:     params.id,
    reason:        body.reason,
    ...meta,
  })

  return NextResponse.json({ success: true })
}
