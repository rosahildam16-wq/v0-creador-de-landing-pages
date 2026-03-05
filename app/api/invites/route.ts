import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireSession } from "@/lib/auth/session"

// ─── GET /api/invites?email=X ──────────────────────────────────────────────
// Lists all active invites created by the requesting member.

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email")
  if (!email) {
    return NextResponse.json({ error: "Email requerido" }, { status: 400 })
  }

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

  const normalized = email.toLowerCase().trim()

  // Look up member record
  const { data: member } = await db
    .from("community_members")
    .select("member_id, username, community_id, role, activo")
    .eq("email", normalized)
    .maybeSingle()

  if (!member) {
    return NextResponse.json({ error: "Miembro no encontrado" }, { status: 404 })
  }

  // Fetch their invites
  const { data: invites, error } = await db
    .from("community_invites")
    .select(`
      id, token, community_id, role, sponsor_username,
      max_uses, uses, expires_at, is_active, created_at
    `)
    .eq("sponsor_username", member.username)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[invites GET]", error.message)
    return NextResponse.json({ error: "Error al cargar invites" }, { status: 500 })
  }

  // Fetch community names
  const communityIds = [...new Set((invites ?? []).map((i) => i.community_id))]
  const { data: communities } = await db
    .from("communities")
    .select("id, nombre, slug, color")
    .in("id", communityIds)

  const commMap = new Map((communities ?? []).map((c) => [c.id, c]))

  const enriched = (invites ?? []).map((inv) => {
    const comm = commMap.get(inv.community_id)
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const communitySlug = comm?.slug ?? inv.community_id
    return {
      ...inv,
      community_name: comm?.nombre ?? inv.community_id,
      community_slug: communitySlug,
      community_color: comm?.color ?? "#8b5cf6",
      invite_url: `${baseUrl}/join/${communitySlug}?token=${inv.token}`,
      uses_remaining: inv.max_uses > 0 ? inv.max_uses - inv.uses : null,
    }
  })

  return NextResponse.json({ invites: enriched, member })
}

// ─── POST /api/invites ─────────────────────────────────────────────────────
// Creates a new invite link for the requesting member.
// Members with active plan (plan_47+) or role leader/owner can create invites.

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      email,
      community_id,
      max_uses = 0,
      expires_in_days = null,
      custom_token = null,
    } = body as {
      email: string
      community_id?: string
      max_uses?: number
      expires_in_days?: number | null
      custom_token?: string | null
    }

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const db = createAdminClient()
    if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

    const normalized = email.toLowerCase().trim()

    // Get member record
    const { data: member } = await db
      .from("community_members")
      .select("member_id, username, community_id, role, activo")
      .eq("email", normalized)
      .maybeSingle()

    if (!member || !member.activo) {
      return NextResponse.json({ error: "Miembro no encontrado o inactivo" }, { status: 403 })
    }

    // Validate permission to create invites
    // Allowed: leaders, owners, or members with plan_47+
    const canInvite = member.role === "leader" || member.role === "owner"
    if (!canInvite) {
      // Check platform plan
      const { data: sub } = await db
        .from("user_platform_subscription")
        .select("platform_plan_code, status")
        .eq("user_id", member.member_id)
        .in("status", ["active", "trialing"])
        .maybeSingle()

      const activePaidPlans = ["plan_47", "plan_97", "plan_300"]
      if (!sub || !activePaidPlans.includes(sub.platform_plan_code)) {
        return NextResponse.json(
          {
            error:
              "Solo miembros con plan activo (plan 47 o superior) pueden generar invitaciones.",
            code: "plan_required",
          },
          { status: 403 }
        )
      }
    }

    // Resolve community — use member's own community if not specified
    const targetCommunityId = community_id || member.community_id

    // Verify the community exists and is active
    const { data: community } = await db
      .from("communities")
      .select("id, nombre, slug, color, activa")
      .eq("id", targetCommunityId)
      .maybeSingle()

    if (!community || !community.activa) {
      return NextResponse.json({ error: "Comunidad no encontrada o inactiva" }, { status: 404 })
    }

    // Generate or use custom token
    const token =
      custom_token?.toLowerCase().trim() ||
      `${member.username}-${Math.random().toString(36).substring(2, 8)}`

    // Check token uniqueness
    const { data: existing } = await db
      .from("community_invites")
      .select("id")
      .eq("token", token)
      .maybeSingle()

    if (existing) {
      return NextResponse.json(
        { error: "Este token ya está en uso. Prueba uno diferente." },
        { status: 409 }
      )
    }

    // Compute expiry
    const expires_at =
      expires_in_days && expires_in_days > 0
        ? new Date(Date.now() + expires_in_days * 86400 * 1000).toISOString()
        : null

    // Insert invite
    const { data: invite, error: insertError } = await db
      .from("community_invites")
      .insert({
        token,
        community_id: targetCommunityId,
        role: "member",
        sponsor_username: member.username,
        max_uses: Math.max(0, max_uses),
        uses: 0,
        expires_at,
        is_active: true,
        created_by: member.username,
      })
      .select()
      .single()

    if (insertError) {
      console.error("[invites POST] insert:", insertError.message)
      return NextResponse.json({ error: "Error al crear invitación" }, { status: 500 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || ""
    const communitySlug = community.slug ?? targetCommunityId

    return NextResponse.json({
      success: true,
      invite: {
        ...invite,
        community_name: community.nombre,
        community_slug: communitySlug,
        invite_url: `${baseUrl}/join/${communitySlug}?token=${token}`,
      },
    })
  } catch (err) {
    console.error("[invites POST] error:", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

// ─── DELETE /api/invites?id=X ──────────────────────────────────────────────
// Deactivates an invite (soft delete via is_active = false).

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")
    const email = req.nextUrl.searchParams.get("email")
    if (!id || !email) {
      return NextResponse.json({ error: "id y email requeridos" }, { status: 400 })
    }

    const db = createAdminClient()
    if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

    const { data: member } = await db
      .from("community_members")
      .select("username")
      .eq("email", email.toLowerCase().trim())
      .maybeSingle()

    if (!member) return NextResponse.json({ error: "No autorizado" }, { status: 403 })

    // Only deactivate if this invite belongs to the requesting member
    const { error } = await db
      .from("community_invites")
      .update({ is_active: false })
      .eq("id", id)
      .eq("sponsor_username", member.username)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
