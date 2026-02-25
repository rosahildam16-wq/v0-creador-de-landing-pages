import { NextRequest, NextResponse } from "next/server"
import { hasValidAccess, getSubscription, getPaymentHistory } from "@/lib/subscription-data"

export async function GET(request: NextRequest) {
  try {
    const email = request.nextUrl.searchParams.get("email")
    if (!email) {
      return NextResponse.json({ error: "Se requiere email" }, { status: 400 })
    }

    const access = await hasValidAccess(email)
    const subscription = access.subscription

    let payments: unknown[] = []
    if (subscription) {
      payments = await getPaymentHistory(subscription.id)
    }

    return NextResponse.json({
      hasAccess: access.hasAccess,
      reason: access.reason,
      subscription: subscription
        ? {
            id: subscription.id,
            plan_id: subscription.plan_id,
            status: subscription.status,
            trial_ends_at: subscription.trial_ends_at,
            current_period_start: subscription.current_period_start,
            current_period_end: subscription.current_period_end,
            plan: subscription.plan,
          }
        : null,
      payments,
    })
  } catch (error) {
    console.error("Error checking subscription:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    )
  }
}
