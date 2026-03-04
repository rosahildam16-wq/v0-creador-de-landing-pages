import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth/session"
import { getCommunityPlan, getCommunityMembership, startMembershipTrial } from "@/lib/server/community-plans"

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
 * POST /api/communities/[id]/membership/trial
 * Starts a free trial membership for the authenticated user in this community.
 *
 * Rules:
 *  - User must not already have an active/trialing membership.
 *  - The community plan must exist and be active.
 *  - Trial length comes from the plan's trial_days field.
 *
 * Body: { planId }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(request)
  if (!user?.memberId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const userId = user.memberId as string

  let body: { planId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  if (!body.planId) {
    return NextResponse.json({ error: "Se requiere: planId" }, { status: 400 })
  }

  // Verify the plan belongs to this community and is active
  const plan = await getCommunityPlan(body.planId)
  if (!plan || plan.community_id !== params.id || !plan.is_active) {
    return NextResponse.json({ error: "Plan no encontrado o inactivo" }, { status: 404 })
  }

  // Check for an existing non-canceled membership
  const existing = await getCommunityMembership(params.id, userId)
  if (existing && existing.status !== "canceled") {
    return NextResponse.json(
      { error: "Ya tienes una membresía activa en esta comunidad" },
      { status: 409 }
    )
  }

  const membership = await startMembershipTrial(params.id, userId, plan.id, plan.trial_days)
  if (!membership) {
    return NextResponse.json({ error: "Error al iniciar periodo de prueba" }, { status: 500 })
  }

  return NextResponse.json({ membership }, { status: 201 })
}
