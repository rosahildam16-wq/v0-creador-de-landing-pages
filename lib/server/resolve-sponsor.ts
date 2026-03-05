import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ResolvedContext {
  /** Resolved community id — never "general" if we could find a real one */
  communityId: string
  communityName: string
  communitySlug: string | null
  communityColor: string
  trialDays: number
  /** Sponsor info, null if none found */
  sponsorUsername: string | null
  sponsorName: string | null
  sponsorMemberId: string | null
  /** Invite row id — set when resolved via invite token */
  inviteId: string | null
  inviteToken: string | null
}

export interface ResolveInput {
  /** Invite token (highest priority) */
  inviteToken?: string | null
  /** Sponsor username (fallback when no token) */
  sponsorUsername?: string | null
  /** Community slug/id (fallback when neither token nor sponsor) */
  communitySlug?: string | null
}

// ─── Errors ───────────────────────────────────────────────────────────────────

export class InviteError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "not_found"
      | "expired"
      | "maxed_out"
      | "inactive"
      | "community_inactive" = "not_found"
  ) {
    super(message)
    this.name = "InviteError"
  }
}

// ─── Core resolver ────────────────────────────────────────────────────────────

/**
 * Universal sponsor + community resolver.
 *
 * Priority:
 *  1. invite_token  → community_invites → community_id + sponsor_username
 *  2. sponsor_username → community_members → community_id
 *  3. community_slug → communities → community_id (no sponsor)
 *
 * Never returns a hardcoded community.
 * Throws InviteError if the token is invalid/expired/maxed.
 */
export async function resolveSponsorAndCommunity(
  input: ResolveInput
): Promise<ResolvedContext> {
  const db = createAdminClient()
  if (!db) throw new Error("DB not available")

  const token = input.inviteToken?.toLowerCase().trim() || null
  const sponsorUsername = input.sponsorUsername?.toLowerCase().trim() || null
  const slug = input.communitySlug?.toLowerCase().trim() || null

  // ── 1. Via invite token ──────────────────────────────────────────────────
  if (token) {
    const { data: invite, error } = await db
      .from("community_invites")
      .select(
        "id, community_id, sponsor_username, max_uses, uses, expires_at, is_active"
      )
      .eq("token", token)
      .maybeSingle()

    if (error) throw new Error(`DB error resolving invite: ${error.message}`)
    if (!invite) throw new InviteError("Invitación no encontrada", "not_found")
    if (invite.is_active === false)
      throw new InviteError("Esta invitación ya no está activa", "inactive")
    if (invite.expires_at && new Date(invite.expires_at) < new Date())
      throw new InviteError("Esta invitación ha expirado", "expired")
    if (invite.max_uses > 0 && invite.uses >= invite.max_uses)
      throw new InviteError(
        "Esta invitación ha alcanzado su límite de usos",
        "maxed_out"
      )

    const community = await fetchCommunity(db, invite.community_id)
    const sponsor = invite.sponsor_username
      ? await fetchSponsor(db, invite.sponsor_username)
      : null

    return {
      communityId: community.id,
      communityName: community.nombre,
      communitySlug: community.slug ?? community.id,
      communityColor: community.color ?? "#8b5cf6",
      trialDays: community.default_trial_days ?? community.free_trial_days ?? 7,
      sponsorUsername: sponsor?.username ?? invite.sponsor_username ?? null,
      sponsorName: sponsor?.name ?? null,
      sponsorMemberId: sponsor?.member_id ?? null,
      inviteId: invite.id,
      inviteToken: token,
    }
  }

  // ── 2. Via sponsor username ──────────────────────────────────────────────
  if (sponsorUsername) {
    const sponsor = await fetchSponsor(db, sponsorUsername)
    if (sponsor) {
      const community = await fetchCommunity(db, sponsor.community_id)
      return {
        communityId: community.id,
        communityName: community.nombre,
        communitySlug: community.slug ?? community.id,
        communityColor: community.color ?? "#8b5cf6",
        trialDays:
          community.default_trial_days ?? community.free_trial_days ?? 7,
        sponsorUsername: sponsor.username,
        sponsorName: sponsor.name,
        sponsorMemberId: sponsor.member_id,
        inviteId: null,
        inviteToken: null,
      }
    }
  }

  // ── 3. Via community slug / id ───────────────────────────────────────────
  if (slug) {
    const community = await fetchCommunityBySlug(db, slug)
    if (community) {
      return {
        communityId: community.id,
        communityName: community.nombre,
        communitySlug: community.slug ?? community.id,
        communityColor: community.color ?? "#8b5cf6",
        trialDays:
          community.default_trial_days ?? community.free_trial_days ?? 7,
        sponsorUsername: null,
        sponsorName: null,
        sponsorMemberId: null,
        inviteId: null,
        inviteToken: null,
      }
    }
  }

  // ── Nothing resolved ─────────────────────────────────────────────────────
  return {
    communityId: "general",
    communityName: "General",
    communitySlug: "general",
    communityColor: "#6366f1",
    trialDays: 5,
    sponsorUsername: null,
    sponsorName: null,
    sponsorMemberId: null,
    inviteId: null,
    inviteToken: null,
  }
}

/**
 * Atomically increment invite.uses after a successful registration.
 * Call this AFTER the member row is committed.
 */
export async function incrementInviteUses(inviteId: string): Promise<void> {
  const db = createAdminClient()
  if (!db) return

  const { data: inv } = await db
    .from("community_invites")
    .select("uses")
    .eq("id", inviteId)
    .maybeSingle()

  await db
    .from("community_invites")
    .update({ uses: (inv?.uses ?? 0) + 1 })
    .eq("id", inviteId)
}

// ─── Private helpers ──────────────────────────────────────────────────────────

async function fetchCommunity(db: ReturnType<typeof createAdminClient>, id: string) {
  const { data, error } = await db!
    .from("communities")
    .select("id, nombre, slug, color, activa, free_trial_days, default_trial_days")
    .eq("id", id)
    .maybeSingle()

  if (error || !data) throw new InviteError("Comunidad no encontrada", "community_inactive")
  if (!data.activa) throw new InviteError("La comunidad ya no está activa", "community_inactive")
  return data
}

async function fetchCommunityBySlug(db: ReturnType<typeof createAdminClient>, slug: string) {
  const { data } = await db!
    .from("communities")
    .select("id, nombre, slug, color, activa, free_trial_days, default_trial_days")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .eq("activa", true)
    .maybeSingle()
  return data
}

async function fetchSponsor(
  db: ReturnType<typeof createAdminClient>,
  username: string
): Promise<{ member_id: string; name: string; username: string; community_id: string } | null> {
  const { data } = await db!
    .from("community_members")
    .select("member_id, name, username, community_id")
    .eq("username", username)
    .maybeSingle()
  return data ?? null
}
