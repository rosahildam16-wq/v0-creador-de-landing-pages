import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

// ─── Types ──────────────────────────────────────────────────────────────────

export interface PlatformPlan {
  code: string
  name: string
  price: number
  currency: string
  interval: string
  trial_days: number
  is_active: boolean
  limits: PlatformPlanLimits
  created_at: string
}

export interface PlatformPlanLimits {
  funnels_max: number          // -1 = unlimited, 0 = none
  communities_max: number      // -1 = unlimited, 0 = none
  contacts_max: number         // -1 = unlimited
  can_create_community: boolean
  can_create_funnel: boolean
  commission_cap_monthly: number | null   // null = unlimited
  tools: string[]
}

export type UserPlatformStatus = "trialing" | "active" | "past_due" | "canceled"

export interface UserPlatformSubscription {
  id: string
  user_id: string
  platform_plan_code: string
  status: UserPlatformStatus
  trial_start: string | null
  trial_end: string | null
  current_period_start: string | null
  current_period_end: string | null
  downgrade_to_student_at: string | null
  created_at: string
  updated_at: string
}

export interface UpsertPlatformSubscriptionData {
  platform_plan_code: string
  status: UserPlatformStatus
  trial_start?: string | null
  trial_end?: string | null
  current_period_start?: string | null
  current_period_end?: string | null
  downgrade_to_student_at?: string | null
}

// ─── Platform Plans ──────────────────────────────────────────────────────────

/** Returns all active platform plans ordered by price ascending. */
export async function getPlatformPlans(): Promise<PlatformPlan[]> {
  const db = createAdminClient()
  if (!db) return []

  const { data, error } = await db
    .from("platform_plans")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true })

  if (error) {
    console.error("[platform-plans] getPlatformPlans:", error.message)
    return []
  }
  return (data ?? []) as PlatformPlan[]
}

/** Returns a single plan by code, or null if not found. */
export async function getPlatformPlan(code: string): Promise<PlatformPlan | null> {
  const db = createAdminClient()
  if (!db) return null

  const { data, error } = await db
    .from("platform_plans")
    .select("*")
    .eq("code", code)
    .maybeSingle()

  if (error) {
    console.error("[platform-plans] getPlatformPlan:", error.message)
    return null
  }
  return data as PlatformPlan | null
}

// ─── User Platform Subscriptions ─────────────────────────────────────────────

/** Returns the user's current platform subscription row, or null. */
export async function getUserPlatformSubscription(
  userId: string
): Promise<UserPlatformSubscription | null> {
  const db = createAdminClient()
  if (!db) return null

  const { data, error } = await db
    .from("user_platform_subscription")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle()

  if (error) {
    console.error("[platform-plans] getUserPlatformSubscription:", error.message)
    return null
  }
  return data as UserPlatformSubscription | null
}

/**
 * Creates or updates the user's platform subscription.
 * Uses UPSERT on user_id (UNIQUE constraint).
 */
export async function upsertUserPlatformSubscription(
  userId: string,
  data: UpsertPlatformSubscriptionData
): Promise<UserPlatformSubscription | null> {
  const db = createAdminClient()
  if (!db) return null

  const now = new Date().toISOString()
  const { data: row, error } = await db
    .from("user_platform_subscription")
    .upsert(
      { user_id: userId, ...data, updated_at: now },
      { onConflict: "user_id" }
    )
    .select()
    .single()

  if (error) {
    console.error("[platform-plans] upsertUserPlatformSubscription:", error.message)
    return null
  }
  return row as UserPlatformSubscription
}

/**
 * Sets downgrade_to_student_at on a user's subscription.
 * Called when a trial ends or a subscription is canceled without payment.
 */
export async function scheduleUserDowngrade(
  userId: string,
  at: Date
): Promise<void> {
  const db = createAdminClient()
  if (!db) return

  const { error } = await db
    .from("user_platform_subscription")
    .update({ downgrade_to_student_at: at.toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId)

  if (error) {
    console.error("[platform-plans] scheduleUserDowngrade:", error.message)
  }
}

/**
 * Downgrades all users whose downgrade_to_student_at is in the past.
 * Intended to be called by a scheduled job (e.g. cron every hour).
 * Returns the number of users downgraded.
 */
export async function processScheduledDowngrades(): Promise<number> {
  const db = createAdminClient()
  if (!db) return 0

  const now = new Date().toISOString()
  const { data, error } = await db
    .from("user_platform_subscription")
    .update({
      platform_plan_code: "student",
      status: "canceled",
      downgrade_to_student_at: null,
      updated_at: now,
    })
    .lt("downgrade_to_student_at", now)
    .not("downgrade_to_student_at", "is", null)
    .select("user_id")

  if (error) {
    console.error("[platform-plans] processScheduledDowngrades:", error.message)
    return 0
  }
  return data?.length ?? 0
}

/**
 * Checks whether a user's plan includes a given tool slug.
 * Fetches the subscription + plan limits from the DB.
 * Returns false if user has no subscription (treated as student).
 */
export async function userHasTool(userId: string, tool: string): Promise<boolean> {
  const db = createAdminClient()
  if (!db) return false

  const { data, error } = await db
    .from("user_platform_subscription")
    .select("platform_plan_code, status, platform_plans(limits)")
    .eq("user_id", userId)
    .maybeSingle()

  if (error || !data) return false

  // past_due and canceled users lose tool access
  if (data.status === "past_due" || data.status === "canceled") return false

  const limits = (data as any).platform_plans?.limits as PlatformPlanLimits | undefined
  return limits?.tools?.includes(tool) ?? false
}
