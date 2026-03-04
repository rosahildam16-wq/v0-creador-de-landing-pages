import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, requireRole } from "@/lib/server/admin-guard"
import { createAdminClient } from "@/lib/supabase/admin"
import { recordCommission } from "@/lib/server/commissions"
import { logAuditEvent } from "@/lib/server/audit"

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/payments/manual-confirm
 *
 * Simulates a confirmed payment for a user. Used while Alivio integration
 * is still being wired. Performs the exact same actions as the
 * payment.finished webhook would:
 *
 *  1. Activates user_platform_subscription (status → active, sets period dates)
 *  2. Records a commissions row for L1/L2 sponsors (20% each)
 *  3. Writes an audit log entry
 *
 * Body: {
 *   userId,           // community_members.member_id
 *   planCode,         // platform plan code (plan_27 | plan_47 | plan_97 | plan_300)
 *   grossAmount,      // payment amount in USD (used for commission calculation)
 *   billingInterval,  // 'monthly' | 'annual'  (default: 'monthly')
 *   reason?,          // admin note stored in audit log
 * }
 *
 * Access: super_admin only (finance operations that affect commission ledger)
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ["super_admin"])
  if (!roleCheck.ok) return roleCheck.response

  let body: {
    userId?: string
    planCode?: string
    grossAmount?: number
    billingInterval?: string
    reason?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const {
    userId,
    planCode,
    grossAmount,
    billingInterval = "monthly",
    reason,
  } = body

  if (!userId || !planCode || grossAmount === undefined || grossAmount <= 0) {
    return NextResponse.json(
      { error: "Se requieren: userId, planCode, grossAmount (> 0)" },
      { status: 400 }
    )
  }

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "Config error" }, { status: 500 })

  // ── 1. Verify plan exists ──────────────────────────────────────────────────
  const { data: plan } = await db
    .from("platform_plans")
    .select("code, trial_days")
    .eq("code", planCode)
    .eq("is_active", true)
    .maybeSingle()

  if (!plan) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
  }

  // ── 2. Verify user exists ──────────────────────────────────────────────────
  const { data: member } = await db
    .from("community_members")
    .select("member_id, email, name")
    .eq("member_id", userId)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  // ── 3. Activate user_platform_subscription ─────────────────────────────────
  const now = new Date()
  const periodEnd = new Date(now)
  if (billingInterval === "annual") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  const { error: subError } = await db
    .from("user_platform_subscription")
    .upsert(
      {
        user_id: userId,
        platform_plan_code: planCode,
        billing_interval: billingInterval,
        status: "active",
        trial_start: null,
        trial_end: null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        downgrade_to_student_at: null,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    )

  if (subError) {
    console.error("[manual-confirm] subscription upsert:", subError)
    return NextResponse.json({ error: "Error al activar suscripción" }, { status: 500 })
  }

  // ── 4. Record commission (L1 + L2) ────────────────────────────────────────
  const commission = await recordCommission({
    payerUserId: userId,
    platformPlanCode: planCode,
    grossAmount,
    currency: "USD",
    periodStart: now,
    periodEnd,
    metadata: {
      source: "admin_manual_confirm",
      billing_interval: billingInterval,
      admin_user_id: guard.user.memberId as string ?? "admin",
      reason: reason ?? null,
    },
  })

  // ── 5. Audit log ──────────────────────────────────────────────────────────
  void logAuditEvent({
    actor_user_id: guard.user.memberId as string ?? "admin",
    actor_role: guard.user.role,
    action_type: "admin.manual_payment_confirm",
    target_type: "user_platform_subscription",
    target_id: userId,
    payload: {
      plan_code: planCode,
      gross_amount: grossAmount,
      billing_interval: billingInterval,
      commission_id: commission?.id ?? null,
      l1_amount: commission?.level1_amount ?? 0,
      l2_amount: commission?.level2_amount ?? 0,
      l1_sponsor: commission?.sponsor_level1_user_id ?? null,
      l2_sponsor: commission?.sponsor_level2_user_id ?? null,
      commission_status: commission?.status ?? "not_recorded",
      reason: reason ?? null,
    },
  })

  return NextResponse.json({
    success: true,
    subscription: {
      user_id: userId,
      plan_code: planCode,
      billing_interval: billingInterval,
      status: "active",
      current_period_end: periodEnd.toISOString(),
    },
    commission: commission
      ? {
          id: commission.id,
          status: commission.status,
          level1_amount: commission.level1_amount,
          level2_amount: commission.level2_amount,
          sponsor_level1_user_id: commission.sponsor_level1_user_id,
          sponsor_level2_user_id: commission.sponsor_level2_user_id,
        }
      : null,
  })
}
