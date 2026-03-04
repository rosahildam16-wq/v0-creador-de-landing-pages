import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth/session"
import {
  updateCommunityPlan,
  deactivateCommunityPlan,
  getCommunityPlan,
  type CommunityPlanInterval,
} from "@/lib/server/community-plans"

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

async function assertLeaderOrAdmin(
  request: NextRequest,
  communityId: string
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  const user = await getSessionUser(request)
  if (!user) {
    return { ok: false, response: NextResponse.json({ error: "No autenticado" }, { status: 401 }) }
  }
  const isAdmin = ["super_admin", "admin"].includes(user.role as string)
  const isLeaderOfThisCommunity = user.role === "leader" && user.communityId === communityId
  if (!isAdmin && !isLeaderOfThisCommunity) {
    return { ok: false, response: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }) }
  }
  return { ok: true }
}

/**
 * PATCH /api/communities/[id]/plans/[planId]
 * Updates an existing community plan.
 * Requires leader of the community or admin.
 *
 * Body: { name?, price?, currency?, interval?, trial_days?, is_active? }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; planId: string } }
) {
  const auth = await assertLeaderOrAdmin(request, params.id)
  if (!auth.ok) return auth.response

  // Verify the plan belongs to this community
  const existing = await getCommunityPlan(params.planId)
  if (!existing || existing.community_id !== params.id) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
  }

  let body: {
    name?: string
    price?: number
    currency?: string
    interval?: CommunityPlanInterval
    trial_days?: number
    is_active?: boolean
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  const updated = await updateCommunityPlan(params.planId, body)
  if (!updated) {
    return NextResponse.json({ error: "Error al actualizar plan" }, { status: 500 })
  }

  return NextResponse.json({ plan: updated })
}

/**
 * DELETE /api/communities/[id]/plans/[planId]
 * Soft-deactivates a community plan (sets is_active = false).
 * Requires leader of the community or admin.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; planId: string } }
) {
  const auth = await assertLeaderOrAdmin(request, params.id)
  if (!auth.ok) return auth.response

  const existing = await getCommunityPlan(params.planId)
  if (!existing || existing.community_id !== params.id) {
    return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
  }

  await deactivateCommunityPlan(params.planId)
  return NextResponse.json({ success: true })
}
