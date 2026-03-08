/**
 * POST /api/admin/communities/transfer-owner
 *
 * Transfers ownership of a community to a new user.
 * Restricted to super_admin only.
 *
 * Body:
 *   {
 *     communityIdOrSlugOrNombre: string,  // UUID, slug, exact nombre, or partial match
 *     newOwnerUsername: string            // e.g. "sensei"
 *   }
 *
 * Actions:
 *   1. Locate community by id → slug → nombre (exact, case-insensitive) → nombre LIKE %…%
 *   2. Update communities.owner_username = newOwnerUsername
 *   3. Upsert community_members: ensure newOwner has role='leader' in that community
 *   4. Return the updated community row + membership status
 */

import { NextRequest, NextResponse } from "next/server"
import {
  requireAdminSession,
  requireRole,
  getActorId,
  getRequestMeta,
} from "@/lib/server/admin-guard"
import { logAuditEvent } from "@/lib/server/audit"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

// ── Types ─────────────────────────────────────────────────────────────────────

interface Community {
  id: string
  nombre: string
  slug?: string | null
  owner_username?: string | null
  leader_email?: string | null
  leader_name?: string | null
}

interface CommunityMember {
  member_id: string
  community_id: string
  email: string
  name: string
  username?: string | null
  role: string
}

// ── Handler ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Auth guard
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ["super_admin"])
  if (!roleCheck.ok) return roleCheck.response

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

  // Parse body
  let body: { communityIdOrSlugOrNombre?: string; newOwnerUsername?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { communityIdOrSlugOrNombre, newOwnerUsername } = body

  if (!communityIdOrSlugOrNombre?.trim()) {
    return NextResponse.json(
      { error: "Se requiere communityIdOrSlugOrNombre" },
      { status: 400 }
    )
  }

  if (!newOwnerUsername?.trim()) {
    return NextResponse.json(
      { error: "Se requiere newOwnerUsername" },
      { status: 400 }
    )
  }

  const query = communityIdOrSlugOrNombre.trim()
  const newOwner = newOwnerUsername.trim().toLowerCase()

  // ── Step 1: Find community ─────────────────────────────────────────────────

  let community: Community | null = null

  // 1a. Try by exact id (UUID or text id like 'skalia-vip')
  const { data: byId } = await db
    .from("communities")
    .select("id, nombre, slug, owner_username, leader_email, leader_name")
    .eq("id", query)
    .maybeSingle()

  if (byId) community = byId as Community

  // 1b. Try by slug (if slug column exists)
  if (!community) {
    const { data: bySlug } = await db
      .from("communities")
      .select("id, nombre, slug, owner_username, leader_email, leader_name")
      .eq("slug", query)
      .maybeSingle()

    if (bySlug) community = bySlug as Community
  }

  // 1c. Try by exact nombre (case-insensitive)
  if (!community) {
    const { data: byNombre } = await db
      .from("communities")
      .select("id, nombre, slug, owner_username, leader_email, leader_name")
      .ilike("nombre", query)
      .maybeSingle()

    if (byNombre) community = byNombre as Community
  }

  // 1d. Fallback: LIKE %palabra1% AND %palabra2% (split on spaces)
  if (!community) {
    const words = query
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w.replace(/[%_]/g, "\\$&")) // escape LIKE metacharacters

    let queryBuilder = db
      .from("communities")
      .select("id, nombre, slug, owner_username, leader_email, leader_name")

    for (const word of words) {
      queryBuilder = queryBuilder.ilike("nombre", `%${word}%`)
    }

    const { data: byLike, error: likeErr } = await queryBuilder.maybeSingle()

    if (likeErr && likeErr.code === "PGRST116") {
      // Multiple rows matched — return them so caller can be more specific
      const { data: many } = await queryBuilder.limit(5)
      return NextResponse.json(
        {
          error: "Búsqueda ambigua — múltiples comunidades encontradas. Usa el id exacto.",
          matches: many,
        },
        { status: 409 }
      )
    }

    if (byLike) community = byLike as Community
  }

  if (!community) {
    return NextResponse.json(
      { error: `Comunidad no encontrada: "${query}"` },
      { status: 404 }
    )
  }

  const communityId = community.id

  // ── Step 2: Update owner_username ─────────────────────────────────────────

  const { data: updatedCommunity, error: updateErr } = await db
    .from("communities")
    .update({ owner_username: newOwner })
    .eq("id", communityId)
    .select("id, nombre, slug, owner_username, leader_email, leader_name")
    .single()

  if (updateErr) {
    return NextResponse.json(
      { error: `Error al actualizar comunidad: ${updateErr.message}` },
      { status: 500 }
    )
  }

  // ── Step 3: Upsert community_members for new owner ────────────────────────

  let membershipResult: { action: string; member?: CommunityMember | null } = {
    action: "skipped",
  }

  // Find the new owner in community_members by username
  const { data: existingMember } = await db
    .from("community_members")
    .select("member_id, community_id, email, name, username, role")
    .eq("username", newOwner)
    .maybeSingle()

  if (existingMember) {
    // Update their community_id and role to leader
    const updates: Record<string, unknown> = { role: "leader" }

    // Also update their community_id to this community
    if (existingMember.community_id !== communityId) {
      updates.community_id = communityId
    }

    const { error: memberUpdateErr } = await db
      .from("community_members")
      .update(updates)
      .eq("member_id", existingMember.member_id)

    if (memberUpdateErr) {
      console.warn(
        "[transfer-owner] community_members update failed:",
        memberUpdateErr.message
      )
      membershipResult = { action: "update_failed: " + memberUpdateErr.message }
    } else {
      membershipResult = {
        action: "updated_to_leader",
        member: {
          ...(existingMember as CommunityMember),
          ...updates,
        } as CommunityMember,
      }
    }
  } else {
    // New owner doesn't exist in community_members — create a record
    const memberId = `member-${newOwner}-${Date.now()}`
    const { data: inserted, error: insertErr } = await db
      .from("community_members")
      .insert({
        member_id: memberId,
        community_id: communityId,
        email: `${newOwner}@placeholder.local`,
        name: newOwner,
        username: newOwner,
        role: "leader",
      })
      .select()
      .single()

    if (insertErr) {
      console.warn(
        "[transfer-owner] community_members insert failed:",
        insertErr.message
      )
      membershipResult = { action: "insert_failed: " + insertErr.message }
    } else {
      membershipResult = { action: "created_as_leader", member: inserted as CommunityMember }
    }
  }

  // ── Audit log ─────────────────────────────────────────────────────────────

  const actorId = getActorId(guard.user)
  const meta = getRequestMeta(request)

  void logAuditEvent({
    actor_user_id: actorId,
    actor_role: guard.user.role,
    action_type: "transfer_community_owner",
    target_type: "community",
    target_id: communityId,
    payload: {
      community_nombre: community.nombre,
      previous_owner: community.owner_username ?? null,
      new_owner: newOwner,
      membership: membershipResult.action,
    },
    ...meta,
  })

  return NextResponse.json(
    {
      ok: true,
      community: updatedCommunity,
      membership: membershipResult,
    },
    { status: 200 }
  )
}
