import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth/session"
import { getCommunityMembership, updateMembershipStatus, type MembershipStatus } from "@/lib/server/community-plans"

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
 * GET /api/communities/[id]/membership
 * Returns the authenticated user's membership in the given community.
 * Returns { membership: null } if the user is not a member.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(request)
  if (!user?.memberId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const membership = await getCommunityMembership(params.id, user.memberId as string)
  return NextResponse.json({ membership })
}

/**
 * PATCH /api/communities/[id]/membership
 * Updates the status of the authenticated user's membership.
 * Typically called to cancel a membership.
 * Admin can also pass ?userId=... to manage other users.
 *
 * Body: { status: MembershipStatus }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(request)
  if (!user?.memberId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const isAdmin = ["super_admin", "admin"].includes(user.role as string)
  const targetUserId = isAdmin
    ? (request.nextUrl.searchParams.get("userId") ?? (user.memberId as string))
    : (user.memberId as string)

  let body: { status?: MembershipStatus }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  if (!body.status) {
    return NextResponse.json({ error: "Se requiere: status" }, { status: 400 })
  }

  const membership = await getCommunityMembership(params.id, targetUserId)
  if (!membership) {
    return NextResponse.json({ error: "Membresía no encontrada" }, { status: 404 })
  }

  await updateMembershipStatus(membership.id, body.status)
  return NextResponse.json({ success: true })
}
