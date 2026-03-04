import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth/session"
import {
  getCommunityPlans,
  createCommunityPlan,
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

/**
 * GET /api/communities/[id]/plans
 * Returns all active plans for the given community.
 * Public within the platform (any authenticated user can view plans).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const plans = await getCommunityPlans(params.id)
  return NextResponse.json({ plans })
}

/**
 * POST /api/communities/[id]/plans
 * Creates a new plan for this community.
 * Requires the caller to be a leader of this community or an admin.
 *
 * Body: { name, price, currency?, interval?, trial_days? }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const isAdmin = ["super_admin", "admin"].includes(user.role as string)
  const isLeaderOfThisCommunity =
    user.role === "leader" && user.communityId === params.id

  if (!isAdmin && !isLeaderOfThisCommunity) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  let body: {
    name?: string
    price?: number
    currency?: string
    interval?: CommunityPlanInterval
    trial_days?: number
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  if (!body.name || body.price === undefined) {
    return NextResponse.json({ error: "Se requieren: name, price" }, { status: 400 })
  }

  const plan = await createCommunityPlan({
    community_id: params.id,
    name: body.name,
    price: body.price,
    currency: body.currency,
    interval: body.interval,
    trial_days: body.trial_days,
  })

  if (!plan) {
    return NextResponse.json({ error: "Error al crear plan" }, { status: 500 })
  }

  return NextResponse.json({ plan }, { status: 201 })
}
