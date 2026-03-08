import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"
import { getPlatformPlan } from "@/lib/server/platform-plans"

export const dynamic = "force-dynamic"

async function getSessionUserId(request: NextRequest): Promise<string | null> {
  try {
    const token = request.cookies.get("mf_session")?.value
    if (!token) return null
    const session = await decrypt(token)
    return (session?.user?.memberId as string) ?? null
  } catch {
    return null
  }
}

/**
 * POST /api/platform/select-plan
 * Called after registration when the user selects a plan in the join flow.
 * Sets up a trial subscription for the chosen plan.
 *
 * Body: { planCode, billingInterval }
 */
export async function POST(request: NextRequest) {
  const userId = await getSessionUserId(request)
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  let body: { planCode?: string; billingInterval?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  const { planCode, billingInterval = "monthly" } = body

  if (!planCode || planCode === "student") {
    return NextResponse.json({ error: "Plan inválido" }, { status: 400 })
  }

  const plan = await getPlatformPlan(planCode)
  if (!plan) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
  }

  const db = createAdminClient()
  if (!db) {
    return NextResponse.json({ error: "Error de configuración" }, { status: 500 })
  }

  const now = new Date()
  const trialEnd = new Date(now)
  trialEnd.setDate(trialEnd.getDate() + plan.trial_days)

  // Set period end based on billing interval
  const periodEnd = new Date(now)
  if (billingInterval === "annual") {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1)
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1)
  }

  // Downgrade to student if trial expires unpaid
  const downgradeAt = plan.trial_days > 0 ? trialEnd.toISOString() : null

  const { data, error } = await db
    .from("user_platform_subscription")
    .upsert(
      {
        user_id: userId,
        platform_plan_code: planCode,
        billing_interval: billingInterval,
        status: plan.trial_days > 0 ? "trialing" : "active",
        trial_start: plan.trial_days > 0 ? now.toISOString() : null,
        trial_end: plan.trial_days > 0 ? trialEnd.toISOString() : null,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        downgrade_to_student_at: downgradeAt,
        updated_at: now.toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single()

  if (error) {
    console.error("[select-plan] upsert:", error)
    return NextResponse.json({ error: "Error al guardar plan" }, { status: 500 })
  }

  return NextResponse.json({ success: true, subscription: data })
}
