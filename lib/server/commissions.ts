import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"
import { getSponsor, getL2Sponsor } from "./referrals"
import { getUserPlatformSubscription } from "./platform-plans"
import type { PlatformPlanLimits } from "./platform-plans"

// ─── Types ──────────────────────────────────────────────────────────────────

export type CommissionStatus = "pending" | "payable" | "paid" | "held" | "void"

export interface Commission {
  id: string
  payer_user_id: string
  platform_plan_code: string
  sponsor_level1_user_id: string | null
  sponsor_level2_user_id: string | null
  level1_amount: number
  level2_amount: number
  currency: string
  period_start: string
  period_end: string
  status: CommissionStatus
  reason: string | null
  metadata: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

// Commission rate: 20% per level (platform rule, not configurable per-plan)
const COMMISSION_RATE = 0.20

// Minimum platform plan code that qualifies to receive commissions
// (plan_27 does NOT earn commissions; plan_47+ does)
const QUALIFYING_PLAN_CODES = new Set(["plan_47", "plan_97", "plan_300"])

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Returns how much commission a sponsor has earned in the current calendar month
 * for L1 (direct) commissions. Used to enforce plan-level monthly caps.
 */
export async function getMonthlyL1CapUsage(
  sponsorUserId: string,
  month: Date = new Date()
): Promise<number> {
  const db = createAdminClient()
  if (!db) return 0

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1).toISOString()
  const monthEnd   = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString()

  const { data, error } = await db
    .from("commissions")
    .select("level1_amount")
    .eq("sponsor_level1_user_id", sponsorUserId)
    .gte("period_start", monthStart)
    .lt("period_start", monthEnd)
    .not("status", "in", '("void","held")')

  if (error) {
    console.error("[commissions] getMonthlyL1CapUsage:", error.message)
    return 0
  }

  return (data ?? []).reduce((sum, row) => sum + (row.level1_amount ?? 0), 0)
}

/**
 * Returns how much commission a sponsor has earned at L2 this calendar month.
 */
export async function getMonthlyL2CapUsage(
  sponsorUserId: string,
  month: Date = new Date()
): Promise<number> {
  const db = createAdminClient()
  if (!db) return 0

  const monthStart = new Date(month.getFullYear(), month.getMonth(), 1).toISOString()
  const monthEnd   = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString()

  const { data, error } = await db
    .from("commissions")
    .select("level2_amount")
    .eq("sponsor_level2_user_id", sponsorUserId)
    .gte("period_start", monthStart)
    .lt("period_start", monthEnd)
    .not("status", "in", '("void","held")')

  if (error) {
    console.error("[commissions] getMonthlyL2CapUsage:", error.message)
    return 0
  }

  return (data ?? []).reduce((sum, row) => sum + (row.level2_amount ?? 0), 0)
}

// ─── Commission recording ────────────────────────────────────────────────────

export interface RecordCommissionInput {
  payerUserId: string
  platformPlanCode: string
  /** Gross payment amount from which commissions are calculated */
  grossAmount: number
  currency?: string
  periodStart: Date
  periodEnd: Date
  metadata?: Record<string, unknown>
}

/**
 * Calculates and records a commission row for a platform plan payment.
 *
 * Rules:
 *  - Only platform_plans generate commissions (call this only for platform payments).
 *  - L1 = direct sponsor, L2 = sponsor's sponsor. Each earns COMMISSION_RATE of gross.
 *  - Sponsors must have an active plan in QUALIFYING_PLAN_CODES to receive commissions.
 *  - Monthly cap is enforced per level: if cap is exceeded, the excess is set to 0.
 *
 * Returns the created Commission row, or null on error.
 */
export async function recordCommission(
  input: RecordCommissionInput
): Promise<Commission | null> {
  const db = createAdminClient()
  if (!db) return null

  const {
    payerUserId,
    platformPlanCode,
    grossAmount,
    currency = "USD",
    periodStart,
    periodEnd,
    metadata,
  } = input

  // Look up L1 and L2 sponsors
  const l1Referral = await getSponsor(payerUserId)
  const l2Referral = l1Referral ? await getL2Sponsor(payerUserId) : null

  let l1UserId: string | null = null
  let l2UserId: string | null = null
  let l1Amount = 0
  let l2Amount = 0
  const month = periodStart

  // ── L1 commission ──────────────────────────────────────────────────────────
  if (l1Referral) {
    const l1Sub = await getUserPlatformSubscription(l1Referral.sponsor_user_id)
    const l1Qualifies =
      l1Sub &&
      l1Sub.status === "active" &&
      QUALIFYING_PLAN_CODES.has(l1Sub.platform_plan_code)

    if (l1Qualifies) {
      l1UserId = l1Referral.sponsor_user_id
      const tentativeL1 = parseFloat((grossAmount * COMMISSION_RATE).toFixed(2))

      // Enforce monthly cap from the plan limits
      const l1Plan = l1Sub!.platform_plan_code
      const { data: planRow } = await db
        .from("platform_plans")
        .select("limits")
        .eq("code", l1Plan)
        .maybeSingle()
      const cap: number | null = (planRow?.limits as PlatformPlanLimits)?.commission_cap_monthly ?? null

      if (cap !== null) {
        const used = await getMonthlyL1CapUsage(l1UserId, month)
        const remaining = Math.max(0, cap - used)
        l1Amount = Math.min(tentativeL1, remaining)
      } else {
        l1Amount = tentativeL1
      }
    }
  }

  // ── L2 commission ──────────────────────────────────────────────────────────
  if (l2Referral) {
    const l2Sub = await getUserPlatformSubscription(l2Referral.sponsor_user_id)
    const l2Qualifies =
      l2Sub &&
      l2Sub.status === "active" &&
      QUALIFYING_PLAN_CODES.has(l2Sub.platform_plan_code)

    if (l2Qualifies) {
      l2UserId = l2Referral.sponsor_user_id
      const tentativeL2 = parseFloat((grossAmount * COMMISSION_RATE).toFixed(2))

      const l2Plan = l2Sub!.platform_plan_code
      const { data: planRow } = await db
        .from("platform_plans")
        .select("limits")
        .eq("code", l2Plan)
        .maybeSingle()
      const cap: number | null = (planRow?.limits as PlatformPlanLimits)?.commission_cap_monthly ?? null

      if (cap !== null) {
        const used = await getMonthlyL2CapUsage(l2UserId, month)
        const remaining = Math.max(0, cap - used)
        l2Amount = Math.min(tentativeL2, remaining)
      } else {
        l2Amount = tentativeL2
      }
    }
  }

  const now = new Date().toISOString()
  const { data, error } = await db
    .from("commissions")
    .insert({
      payer_user_id:          payerUserId,
      platform_plan_code:     platformPlanCode,
      sponsor_level1_user_id: l1UserId,
      sponsor_level2_user_id: l2UserId,
      level1_amount:          l1Amount,
      level2_amount:          l2Amount,
      currency,
      period_start:           periodStart.toISOString(),
      period_end:             periodEnd.toISOString(),
      status:                 "pending",
      metadata:               metadata ?? null,
      created_at:             now,
      updated_at:             now,
    })
    .select()
    .single()

  if (error) {
    console.error("[commissions] recordCommission:", error.message)
    return null
  }
  return data as Commission
}

// ─── Status transitions ───────────────────────────────────────────────────────

/**
 * Moves all `pending` commissions for a specific payer + period to `payable`.
 * Called after the anti-fraud hold period has elapsed.
 */
export async function markCommissionsPayable(
  payerUserId: string,
  periodStart: Date
): Promise<number> {
  const db = createAdminClient()
  if (!db) return 0

  const { data, error } = await db
    .from("commissions")
    .update({ status: "payable", updated_at: new Date().toISOString() })
    .eq("payer_user_id", payerUserId)
    .eq("period_start", periodStart.toISOString())
    .eq("status", "pending")
    .select("id")

  if (error) {
    console.error("[commissions] markCommissionsPayable:", error.message)
    return 0
  }
  return data?.length ?? 0
}

/** Places a hold on a commission (e.g. disputed payment). */
export async function holdCommission(commissionId: string, reason: string): Promise<void> {
  const db = createAdminClient()
  if (!db) return

  const { error } = await db
    .from("commissions")
    .update({ status: "held", reason, updated_at: new Date().toISOString() })
    .eq("id", commissionId)

  if (error) {
    console.error("[commissions] holdCommission:", error.message)
  }
}

/** Voids a commission (e.g. chargeback or refund). */
export async function voidCommission(commissionId: string, reason: string): Promise<void> {
  const db = createAdminClient()
  if (!db) return

  const { error } = await db
    .from("commissions")
    .update({ status: "void", reason, updated_at: new Date().toISOString() })
    .eq("id", commissionId)

  if (error) {
    console.error("[commissions] voidCommission:", error.message)
  }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Returns all payable commissions for a beneficiary (L1 or L2). */
export async function getPayableCommissions(sponsorUserId: string): Promise<Commission[]> {
  const db = createAdminClient()
  if (!db) return []

  const { data, error } = await db
    .from("commissions")
    .select("*")
    .or(
      `sponsor_level1_user_id.eq.${sponsorUserId},sponsor_level2_user_id.eq.${sponsorUserId}`
    )
    .eq("status", "payable")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[commissions] getPayableCommissions:", error.message)
    return []
  }
  return (data ?? []) as Commission[]
}

/** Returns commission history for a beneficiary (all statuses). */
export async function getCommissionHistory(
  sponsorUserId: string,
  limit = 50
): Promise<Commission[]> {
  const db = createAdminClient()
  if (!db) return []

  const { data, error } = await db
    .from("commissions")
    .select("*")
    .or(
      `sponsor_level1_user_id.eq.${sponsorUserId},sponsor_level2_user_id.eq.${sponsorUserId}`
    )
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[commissions] getCommissionHistory:", error.message)
    return []
  }
  return (data ?? []) as Commission[]
}
