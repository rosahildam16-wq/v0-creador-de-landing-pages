import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth/session"
import {
  getUserPlatformSubscription,
  upsertUserPlatformSubscription,
  type UpsertPlatformSubscriptionData,
} from "@/lib/server/platform-plans"
import { requireAdminSession } from "@/lib/server/admin-guard"

export const dynamic = "force-dynamic"

/** Extracts the memberId from the session cookie, or returns null. */
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
 * GET /api/platform/subscription
 * Returns the authenticated user's current platform subscription.
 */
export async function GET(request: NextRequest) {
  const userId = await getSessionUserId(request)
  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const sub = await getUserPlatformSubscription(userId)
  return NextResponse.json({ subscription: sub })
}

/**
 * POST /api/platform/subscription
 * Creates or updates a user's platform subscription.
 * Admin-only — called by payment webhooks or admin tooling.
 *
 * Body: { userId, platform_plan_code, status, trial_start?, trial_end?,
 *         current_period_start?, current_period_end?, downgrade_to_student_at? }
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  let body: { userId?: string } & Partial<UpsertPlatformSubscriptionData>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  const { userId, ...data } = body
  if (!userId || !data.platform_plan_code || !data.status) {
    return NextResponse.json(
      { error: "Se requieren: userId, platform_plan_code, status" },
      { status: 400 }
    )
  }

  const sub = await upsertUserPlatformSubscription(userId, data as UpsertPlatformSubscriptionData)
  if (!sub) {
    return NextResponse.json({ error: "Error al actualizar suscripción" }, { status: 500 })
  }

  return NextResponse.json({ subscription: sub })
}
