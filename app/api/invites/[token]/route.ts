import { NextRequest, NextResponse } from "next/server"
import { resolveSponsorAndCommunity, InviteError } from "@/lib/server/resolve-sponsor"

// GET /api/invites/[token]
// Validates an invite link and returns community + sponsor info.
// Used by the /join page to pre-fill community and sponsor fields.

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const { token } = params

  if (!token || token.length < 3) {
    return NextResponse.json({ valid: false, error: "Token inválido" }, { status: 400 })
  }

  try {
    const ctx = await resolveSponsorAndCommunity({ inviteToken: token })

    if (!ctx.inviteId) {
      return NextResponse.json(
        { valid: false, error: "Invitación no encontrada" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      valid: true,
      invite: {
        token: ctx.inviteToken,
        community_id: ctx.communityId,
        community_slug: ctx.communitySlug,
        role: "member",
        sponsor_username: ctx.sponsorUsername,
      },
      community: {
        id: ctx.communityId,
        nombre: ctx.communityName,
        slug: ctx.communitySlug,
        color: ctx.communityColor,
      },
      sponsor: ctx.sponsorUsername
        ? { username: ctx.sponsorUsername, name: ctx.sponsorName }
        : null,
    })
  } catch (err) {
    if (err instanceof InviteError) {
      const status =
        err.code === "expired" || err.code === "maxed_out" || err.code === "inactive"
          ? 410
          : 404
      return NextResponse.json({ valid: false, error: err.message }, { status })
    }
    console.error("[invites/[token]]", err)
    return NextResponse.json(
      { valid: false, error: "Error al verificar invitación" },
      { status: 500 }
    )
  }
}
