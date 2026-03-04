import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth/session"
import { registerReferral, getSponsor, getReferrals, getReferralCount } from "@/lib/server/referrals"

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
 * GET /api/referrals
 * Returns the authenticated user's referral data:
 *   - sponsor: who referred this user (null if none)
 *   - referrals: list of users this user has referred
 *   - count: total direct referrals
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user?.memberId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const userId = user.memberId as string

  const [sponsor, referrals, count] = await Promise.all([
    getSponsor(userId),
    getReferrals(userId),
    getReferralCount(userId),
  ])

  return NextResponse.json({ sponsor, referrals, count })
}

/**
 * POST /api/referrals
 * Registers a referral relationship for the authenticated user.
 * Write-once: if the user already has a sponsor, returns 409.
 *
 * Body: { sponsorUserId }
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user?.memberId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const userId = user.memberId as string

  let body: { sponsorUserId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  if (!body.sponsorUserId) {
    return NextResponse.json({ error: "Se requiere: sponsorUserId" }, { status: 400 })
  }

  // Check if user already has a sponsor
  const existing = await getSponsor(userId)
  if (existing) {
    return NextResponse.json(
      { error: "Ya tienes un patrocinador asignado (regla de cumplimiento)" },
      { status: 409 }
    )
  }

  const referral = await registerReferral(userId, body.sponsorUserId)
  if (!referral) {
    return NextResponse.json({ error: "Error al registrar referido" }, { status: 500 })
  }

  return NextResponse.json({ referral }, { status: 201 })
}
