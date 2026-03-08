import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/server/admin-guard"
import { getQueuedPayouts } from "@/lib/server/payouts"
import { logAuditEvent } from "@/lib/server/audit"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/payouts
 * Returns all queued payouts, oldest first.
 * Used by the finance team to prepare Friday disbursements.
 * Requires finance_admin or higher.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const allowed = ["super_admin", "admin", "finance_admin"]
  if (!allowed.includes(guard.user.role)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const payouts = await getQueuedPayouts()
  return NextResponse.json({ payouts })
}
