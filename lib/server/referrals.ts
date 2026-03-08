import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface Referral {
  id: string
  user_id: string          // the referred user
  sponsor_user_id: string  // who referred them
  created_at: string
}

// ─── Referrals ───────────────────────────────────────────────────────────────

/**
 * Registers a referral relationship.
 * Write-once: if the user already has a sponsor this returns null (compliance rule).
 * The DB trigger `trg_referrals_immutable` blocks UPDATE; INSERT with onConflict
 * DO NOTHING achieves the same for the app layer.
 */
export async function registerReferral(
  userId: string,
  sponsorUserId: string
): Promise<Referral | null> {
  if (userId === sponsorUserId) {
    console.warn("[referrals] registerReferral: user cannot refer themselves")
    return null
  }

  const db = createAdminClient()
  if (!db) return null

  const { data, error } = await db
    .from("referrals")
    .insert({ user_id: userId, sponsor_user_id: sponsorUserId })
    .select()
    .single()

  if (error) {
    // Unique constraint violation means user already has a sponsor — not an error
    if (error.code === "23505") return null
    console.error("[referrals] registerReferral:", error.message)
    return null
  }
  return data as Referral
}

/**
 * Returns the sponsor for a user, or null if the user has no sponsor.
 */
export async function getSponsor(userId: string): Promise<Referral | null> {
  const db = createAdminClient()
  if (!db) return null

  const { data, error } = await db
    .from("referrals")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("[referrals] getSponsor:", error.message)
    return null
  }
  return data as Referral | null
}

/**
 * Returns the sponsor's sponsor (L2) for a user, or null.
 * Used when computing two-level commissions.
 */
export async function getL2Sponsor(userId: string): Promise<Referral | null> {
  const db = createAdminClient()
  if (!db) return null

  // Step 1: find the direct sponsor
  const l1 = await getSponsor(userId)
  if (!l1) return null

  // Step 2: find the sponsor's sponsor
  return getSponsor(l1.sponsor_user_id)
}

/**
 * Returns all referrals made by a sponsor (i.e. everyone they recruited).
 */
export async function getReferrals(sponsorUserId: string): Promise<Referral[]> {
  const db = createAdminClient()
  if (!db) return []

  const { data, error } = await db
    .from("referrals")
    .select("*")
    .eq("sponsor_user_id", sponsorUserId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[referrals] getReferrals:", error.message)
    return []
  }
  return (data ?? []) as Referral[]
}

/**
 * Returns the total number of users directly referred by a sponsor.
 */
export async function getReferralCount(sponsorUserId: string): Promise<number> {
  const db = createAdminClient()
  if (!db) return 0

  const { count, error } = await db
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("sponsor_user_id", sponsorUserId)

  if (error) {
    console.error("[referrals] getReferralCount:", error.message)
    return 0
  }
  return count ?? 0
}
