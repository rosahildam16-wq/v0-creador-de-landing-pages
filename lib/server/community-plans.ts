import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

// ─── Types ──────────────────────────────────────────────────────────────────

export type CommunityPlanInterval =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "yearly"
  | "one_time"

export interface CommunityPlan {
  id: string
  community_id: string
  name: string
  price: number
  currency: string
  interval: CommunityPlanInterval
  trial_days: number
  is_active: boolean
  created_at: string
}

export type MembershipStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "frozen"
  | "canceled"

export interface CommunityMembership {
  id: string
  community_id: string
  user_id: string
  plan_id: string | null
  status: MembershipStatus
  trial_start: string | null
  trial_end: string | null
  current_period_start: string | null
  current_period_end: string | null
  grace_until: string | null
  created_at: string
  updated_at: string
}

// ─── Community Plans ─────────────────────────────────────────────────────────

/** Returns all active plans for a community ordered by price ascending. */
export async function getCommunityPlans(communityId: string): Promise<CommunityPlan[]> {
  const db = createAdminClient()
  if (!db) return []

  const { data, error } = await db
    .from("community_plans")
    .select("*")
    .eq("community_id", communityId)
    .eq("is_active", true)
    .order("price", { ascending: true })

  if (error) {
    console.error("[community-plans] getCommunityPlans:", error.message)
    return []
  }
  return (data ?? []) as CommunityPlan[]
}

/** Returns a single community plan by id, or null. */
export async function getCommunityPlan(planId: string): Promise<CommunityPlan | null> {
  const db = createAdminClient()
  if (!db) return null

  const { data, error } = await db
    .from("community_plans")
    .select("*")
    .eq("id", planId)
    .maybeSingle()

  if (error) {
    console.error("[community-plans] getCommunityPlan:", error.message)
    return null
  }
  return data as CommunityPlan | null
}

export interface CreateCommunityPlanData {
  community_id: string
  name: string
  price: number
  currency?: string
  interval?: CommunityPlanInterval
  trial_days?: number
}

/** Creates a new plan for a community. Returns the created plan or null on error. */
export async function createCommunityPlan(
  input: CreateCommunityPlanData
): Promise<CommunityPlan | null> {
  const db = createAdminClient()
  if (!db) return null

  const { data, error } = await db
    .from("community_plans")
    .insert({
      community_id: input.community_id,
      name: input.name,
      price: input.price,
      currency: input.currency ?? "USD",
      interval: input.interval ?? "monthly",
      trial_days: input.trial_days ?? 7,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error("[community-plans] createCommunityPlan:", error.message)
    return null
  }
  return data as CommunityPlan
}

export interface UpdateCommunityPlanData {
  name?: string
  price?: number
  currency?: string
  interval?: CommunityPlanInterval
  trial_days?: number
  is_active?: boolean
}

/** Updates fields on an existing community plan. Returns updated plan or null. */
export async function updateCommunityPlan(
  planId: string,
  updates: UpdateCommunityPlanData
): Promise<CommunityPlan | null> {
  const db = createAdminClient()
  if (!db) return null

  const { data, error } = await db
    .from("community_plans")
    .update(updates)
    .eq("id", planId)
    .select()
    .single()

  if (error) {
    console.error("[community-plans] updateCommunityPlan:", error.message)
    return null
  }
  return data as CommunityPlan
}

/** Soft-deactivates a community plan (sets is_active = false). */
export async function deactivateCommunityPlan(planId: string): Promise<void> {
  const db = createAdminClient()
  if (!db) return

  const { error } = await db
    .from("community_plans")
    .update({ is_active: false })
    .eq("id", planId)

  if (error) {
    console.error("[community-plans] deactivateCommunityPlan:", error.message)
  }
}

// ─── Community Memberships ────────────────────────────────────────────────────

/**
 * Returns the membership row for a specific user in a community, or null.
 * This is the primary lookup used to determine access.
 */
export async function getCommunityMembership(
  communityId: string,
  userId: string
): Promise<CommunityMembership | null> {
  const db = createAdminClient()
  if (!db) return null

  const { data, error } = await db
    .from("community_memberships")
    .select("*")
    .eq("community_id", communityId)
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("[community-plans] getCommunityMembership:", error.message)
    return null
  }
  return data as CommunityMembership | null
}

/** Returns all memberships for a user (across all communities). */
export async function getUserMemberships(userId: string): Promise<CommunityMembership[]> {
  const db = createAdminClient()
  if (!db) return []

  const { data, error } = await db
    .from("community_memberships")
    .select("*")
    .eq("user_id", userId)

  if (error) {
    console.error("[community-plans] getUserMemberships:", error.message)
    return []
  }
  return (data ?? []) as CommunityMembership[]
}

/**
 * Starts a trial membership for a user in a community.
 * If a membership row already exists it is updated (idempotent).
 * trialDays defaults to the community plan's trial_days if not provided.
 */
export async function startMembershipTrial(
  communityId: string,
  userId: string,
  planId: string,
  trialDays: number
): Promise<CommunityMembership | null> {
  const db = createAdminClient()
  if (!db) return null

  const now = new Date()
  const trialEnd = new Date(now)
  trialEnd.setDate(trialEnd.getDate() + trialDays)
  const nowIso = now.toISOString()
  const trialEndIso = trialEnd.toISOString()

  const { data, error } = await db
    .from("community_memberships")
    .upsert(
      {
        community_id: communityId,
        user_id: userId,
        plan_id: planId,
        status: "trialing",
        trial_start: nowIso,
        trial_end: trialEndIso,
        current_period_start: null,
        current_period_end: null,
        grace_until: null,
        updated_at: nowIso,
      },
      { onConflict: "community_id,user_id" }
    )
    .select()
    .single()

  if (error) {
    console.error("[community-plans] startMembershipTrial:", error.message)
    return null
  }
  return data as CommunityMembership
}

/**
 * Activates a membership after a successful payment.
 * Sets the current billing period and clears trial/grace fields.
 */
export async function activateMembership(
  communityId: string,
  userId: string,
  planId: string,
  periodStart: Date,
  periodEnd: Date
): Promise<CommunityMembership | null> {
  const db = createAdminClient()
  if (!db) return null

  const now = new Date().toISOString()
  const { data, error } = await db
    .from("community_memberships")
    .upsert(
      {
        community_id: communityId,
        user_id: userId,
        plan_id: planId,
        status: "active",
        trial_start: null,
        trial_end: null,
        current_period_start: periodStart.toISOString(),
        current_period_end: periodEnd.toISOString(),
        grace_until: null,
        updated_at: now,
      },
      { onConflict: "community_id,user_id" }
    )
    .select()
    .single()

  if (error) {
    console.error("[community-plans] activateMembership:", error.message)
    return null
  }
  return data as CommunityMembership
}

/**
 * Marks a membership as past_due and sets a 7-day grace window.
 * After grace_until, the member should be frozen by processExpiredGracePeriods().
 */
export async function markMembershipPastDue(
  membershipId: string,
  graceDays = 7
): Promise<void> {
  const db = createAdminClient()
  if (!db) return

  const graceUntil = new Date()
  graceUntil.setDate(graceUntil.getDate() + graceDays)

  const { error } = await db
    .from("community_memberships")
    .update({
      status: "past_due",
      grace_until: graceUntil.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", membershipId)

  if (error) {
    console.error("[community-plans] markMembershipPastDue:", error.message)
  }
}

/**
 * Updates the status of a membership directly (for admin overrides or cancellations).
 */
export async function updateMembershipStatus(
  membershipId: string,
  status: MembershipStatus
): Promise<void> {
  const db = createAdminClient()
  if (!db) return

  const { error } = await db
    .from("community_memberships")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", membershipId)

  if (error) {
    console.error("[community-plans] updateMembershipStatus:", error.message)
  }
}

/**
 * Freezes all past_due memberships whose grace period has expired.
 * Intended to be called by a scheduled job (e.g. cron every hour).
 * Returns the number of memberships frozen.
 */
export async function processExpiredGracePeriods(): Promise<number> {
  const db = createAdminClient()
  if (!db) return 0

  const now = new Date().toISOString()
  const { data, error } = await db
    .from("community_memberships")
    .update({ status: "frozen", updated_at: now })
    .eq("status", "past_due")
    .lt("grace_until", now)
    .not("grace_until", "is", null)
    .select("id")

  if (error) {
    console.error("[community-plans] processExpiredGracePeriods:", error.message)
    return 0
  }
  return data?.length ?? 0
}
