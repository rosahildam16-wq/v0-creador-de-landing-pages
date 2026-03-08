import { NextRequest, NextResponse } from "next/server"
import { markPendingPayableOlderThan } from "@/lib/server/commissions"
import { createAdminClient } from "@/lib/supabase/admin"
import { logAuditEvent } from "@/lib/server/audit"

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/cron/friday-payout
 *
 * Intended to run every Friday via a cron service (e.g. Vercel Cron, GitHub Actions).
 * Requires: Authorization: Bearer <CRON_SECRET>
 *
 * Actions:
 *  1. Move `pending` commissions older than 7 days → `payable` (anti-fraud hold lifted)
 *  2. Accumulate payout balances < $50 by flagging them BELOW_MINIMUM in payout summary
 *     (No actual payout row is created for below-minimum; it stays as payable commission
 *     until the member requests it and the total exceeds $50)
 *
 * The spec says Magic Funnel does NOT execute payments — it only updates states.
 * Actual transfer is done externally via Alivio after admin exports the report.
 */
export async function POST(request: NextRequest) {
  // Cron secret guard
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const results: Record<string, unknown> = {}
  const startedAt = new Date().toISOString()

  // ── Step 1: Release anti-fraud hold (7 days) ─────────────────────────────
  const releasedCount = await markPendingPayableOlderThan(7)
  results.commissions_released_to_payable = releasedCount

  // ── Step 2: Compute per-user payable balance & flag below-minimum ─────────
  const db = createAdminClient()
  if (!db) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 500 })
  }

  // Get all payable commissions grouped by beneficiary
  const { data: payableRows, error: payableErr } = await db
    .from("commissions")
    .select("sponsor_level1_user_id, sponsor_level2_user_id, level1_amount, level2_amount, currency")
    .eq("status", "payable")

  if (payableErr) {
    return NextResponse.json({ error: payableErr.message }, { status: 500 })
  }

  // Sum per user
  const balances: Record<string, number> = {}
  for (const row of payableRows ?? []) {
    if (row.sponsor_level1_user_id && row.level1_amount > 0) {
      balances[row.sponsor_level1_user_id] = (balances[row.sponsor_level1_user_id] ?? 0) + row.level1_amount
    }
    if (row.sponsor_level2_user_id && row.level2_amount > 0) {
      balances[row.sponsor_level2_user_id] = (balances[row.sponsor_level2_user_id] ?? 0) + row.level2_amount
    }
  }

  const MINIMUM_PAYOUT = 50
  const belowMinimum = Object.entries(balances)
    .filter(([, amt]) => amt < MINIMUM_PAYOUT)
    .map(([userId, amt]) => ({ userId, amount: amt }))

  const aboveMinimum = Object.entries(balances)
    .filter(([, amt]) => amt >= MINIMUM_PAYOUT)
    .map(([userId, amt]) => ({ userId, amount: amt }))

  results.users_above_minimum  = aboveMinimum.length
  results.users_below_minimum  = belowMinimum.length
  results.total_payable_amount = Object.values(balances).reduce((s, a) => s + a, 0).toFixed(2)
  results.below_minimum_detail = belowMinimum.slice(0, 50) // cap for response size

  // ── Audit the cron run ────────────────────────────────────────────────────
  void logAuditEvent({
    actor_user_id: "cron",
    actor_role:    "system",
    action_type:   "cron.friday_payout_calculation",
    target_type:   "commissions",
    payload:       {
      started_at:  startedAt,
      ...results,
    },
  })

  return NextResponse.json({
    ok:        true,
    ran_at:    startedAt,
    ...results,
  })
}
