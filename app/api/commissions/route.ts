import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth/session"
import {
  getCommissionHistory,
  getPayableCommissions,
  getMonthlyL1CapUsage,
  getMonthlyL2CapUsage,
} from "@/lib/server/commissions"
import { getUserPlatformSubscription } from "@/lib/server/platform-plans"
import type { PlatformPlanLimits } from "@/lib/server/platform-plans"
import { getReferralCount, getSponsor } from "@/lib/server/referrals"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

async function getSessionUser(request: NextRequest) {
  try {
    const token = request.cookies.get("mf_session")?.value
    if (!token) return null
    const session = await decrypt(token)
    return session?.user ?? null
  } catch {
    return null
  }
}

/**
 * GET /api/commissions
 * Returns commission data for the authenticated user:
 *   - history: last N commission rows (default 50)
 *   - payable: commissions ready to pay out
 *   - monthlyUsage: { level1, level2 } amounts earned this calendar month
 *   - cap: { monthly, l1Used, l2Used, totalUsed } — plan cap + current usage
 *   - referrals: { count, hasSponsor }
 *   - platformPlanCode, subscriptionStatus
 *
 * Query params:
 *   limit (default 50)
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user?.memberId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const userId = user.memberId as string
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "50", 10), 200)

  const [history, payable, monthlyL1, monthlyL2, sub, referralCount, sponsor] = await Promise.all([
    getCommissionHistory(userId, limit),
    getPayableCommissions(userId),
    getMonthlyL1CapUsage(userId),
    getMonthlyL2CapUsage(userId),
    getUserPlatformSubscription(userId),
    getReferralCount(userId),
    getSponsor(userId),
  ])

  // Resolve monthly commission cap from plan limits
  let commissionCapMonthly: number | null = null
  if (sub?.platform_plan_code) {
    const db = createAdminClient()
    if (db) {
      const { data: planRow } = await db
        .from("platform_plans")
        .select("limits")
        .eq("code", sub.platform_plan_code)
        .maybeSingle()
      commissionCapMonthly = (planRow?.limits as PlatformPlanLimits)?.commission_cap_monthly ?? null
    }
  }

  return NextResponse.json({
    history,
    payable,
    monthlyUsage: { level1: monthlyL1, level2: monthlyL2 },
    cap: {
      monthly: commissionCapMonthly,   // null = unlimited; 0 = not eligible
      l1Used: monthlyL1,
      l2Used: monthlyL2,
      totalUsed: monthlyL1 + monthlyL2,
    },
    referrals: {
      count: referralCount,
      hasSponsor: !!sponsor,
    },
    platformPlanCode: sub?.platform_plan_code ?? null,
    subscriptionStatus: sub?.status ?? null,
  })
}
