import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, requireRole, getRequestMeta, getActorId } from "@/lib/server/admin-guard"
import { logAuditEvent } from "@/lib/server/audit"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// Only finance_admin and super_admin can export payout reports for Alivio
const ALLOWED: Parameters<typeof requireRole>[1] = ["super_admin", "finance_admin"]

interface PayoutExportRow {
  user_id: string
  email: string
  payout_amount: number
  currency: string
  status: string
  period_start: string
  period_end: string
  notes: string
  payout_id: string
  requested_at: string
}

/**
 * GET /api/admin/payouts/export?format=csv|json&status=queued
 * Exports payout data in CSV or JSON format for the Alivio payment platform.
 * Only finance_admin and super_admin can access this endpoint.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ALLOWED)
  if (!roleCheck.ok) return roleCheck.response

  const { searchParams } = new URL(request.url)
  const format = searchParams.get("format") === "csv" ? "csv" : "json"
  const statusFilter = searchParams.get("status") || "queued"

  const supabase = createAdminClient()
  if (!supabase) {
    return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })
  }

  // Fetch payouts + join community_members for email
  const { data: payouts, error: payoutsError } = await supabase
    .from("payouts")
    .select("id, user_id, amount, currency, status, notes, created_at, paid_at")
    .eq("status", statusFilter)
    .order("created_at", { ascending: true })

  if (payoutsError) {
    return NextResponse.json({ error: payoutsError.message }, { status: 500 })
  }

  if (!payouts?.length) {
    return NextResponse.json(
      { error: `No hay retiros con status=${statusFilter}` },
      { status: 404 }
    )
  }

  // Resolve emails from community_members
  const userIds = [...new Set(payouts.map((p) => p.user_id))]
  const { data: members } = await supabase
    .from("community_members")
    .select("member_id, email")
    .in("member_id", userIds)

  const emailMap: Record<string, string> = {}
  for (const m of members ?? []) {
    emailMap[m.member_id] = m.email
  }

  const now = new Date()
  const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const periodEnd   = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)

  const rows: PayoutExportRow[] = payouts.map((p) => ({
    user_id:       p.user_id,
    email:         emailMap[p.user_id] ?? "unknown",
    payout_amount: p.amount,
    currency:      p.currency ?? "USD",
    status:        p.status,
    period_start:  periodStart,
    period_end:    periodEnd,
    notes:         p.notes ?? "",
    payout_id:     p.id,
    requested_at:  p.created_at,
  }))

  // Audit the export
  void logAuditEvent({
    actor_user_id: getActorId(guard.user),
    actor_role:    guard.user.role,
    action_type:   "export_payouts",
    target_type:   "payouts",
    payload:       {
      format,
      status_filter: statusFilter,
      count: rows.length,
      total_amount: rows.reduce((s, r) => s + r.payout_amount, 0),
    },
    ...getRequestMeta(request),
  })

  const filename = `magic-funnel-payouts-${statusFilter}-${now.toISOString().slice(0, 10)}`

  if (format === "csv") {
    const headers = [
      "payout_id", "user_id", "email", "payout_amount", "currency",
      "status", "period_start", "period_end", "requested_at", "notes"
    ]
    const csvLines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          r.payout_id,
          r.user_id,
          `"${r.email}"`,
          r.payout_amount.toFixed(2),
          r.currency,
          r.status,
          r.period_start,
          r.period_end,
          r.requested_at,
          `"${(r.notes ?? "").replace(/"/g, '""')}"`,
        ].join(",")
      ),
    ]
    return new NextResponse(csvLines.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    })
  }

  // JSON export
  return new NextResponse(JSON.stringify({ exported_at: now.toISOString(), count: rows.length, rows }, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="${filename}.json"`,
    },
  })
}
