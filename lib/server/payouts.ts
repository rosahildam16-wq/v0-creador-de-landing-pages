import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

// ─── Types ──────────────────────────────────────────────────────────────────

export type PayoutStatus = "queued" | "sent" | "paid" | "failed"

export interface Payout {
  id: string
  user_id: string
  amount: number
  currency: string
  status: PayoutStatus
  notes: string | null
  created_at: string
  paid_at: string | null
}

// Minimum payout amount enforced by DB CHECK(amount >= 50) and this layer
export const MIN_PAYOUT_AMOUNT = 50

// ─── Payout operations ───────────────────────────────────────────────────────

/**
 * Queues a payout for a user.
 * Enforces the $50 minimum before hitting the DB.
 * Returns the created Payout row or null on error.
 */
export async function queuePayout(
  userId: string,
  amount: number,
  currency = "USD",
  notes?: string
): Promise<Payout | null> {
  if (amount < MIN_PAYOUT_AMOUNT) {
    console.warn(
      `[payouts] queuePayout: amount ${amount} is below minimum ${MIN_PAYOUT_AMOUNT}`
    )
    return null
  }

  const db = createAdminClient()
  if (!db) return null

  const { data, error } = await db
    .from("payouts")
    .insert({
      user_id: userId,
      amount,
      currency,
      status: "queued",
      notes: notes ?? null,
    })
    .select()
    .single()

  if (error) {
    console.error("[payouts] queuePayout:", error.message)
    return null
  }
  return data as Payout
}

/**
 * Returns all payouts with `queued` status.
 * Used by the Friday batch job to prepare disbursements.
 */
export async function getQueuedPayouts(): Promise<Payout[]> {
  const db = createAdminClient()
  if (!db) return []

  const { data, error } = await db
    .from("payouts")
    .select("*")
    .eq("status", "queued")
    .order("created_at", { ascending: true })

  if (error) {
    console.error("[payouts] getQueuedPayouts:", error.message)
    return []
  }
  return (data ?? []) as Payout[]
}

/** Returns payout history for a user (all statuses), newest first. */
export async function getUserPayouts(userId: string, limit = 50): Promise<Payout[]> {
  const db = createAdminClient()
  if (!db) return []

  const { data, error } = await db
    .from("payouts")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[payouts] getUserPayouts:", error.message)
    return []
  }
  return (data ?? []) as Payout[]
}

// ─── Status transitions ───────────────────────────────────────────────────────

/**
 * Marks a payout as `sent` (transfer initiated, not yet confirmed).
 */
export async function markPayoutSent(payoutId: string): Promise<void> {
  const db = createAdminClient()
  if (!db) return

  const { error } = await db
    .from("payouts")
    .update({ status: "sent" })
    .eq("id", payoutId)

  if (error) {
    console.error("[payouts] markPayoutSent:", error.message)
  }
}

/**
 * Marks a payout as `paid` (transfer confirmed) and records the paid_at timestamp.
 */
export async function markPayoutPaid(
  payoutId: string,
  paidAt: Date = new Date()
): Promise<void> {
  const db = createAdminClient()
  if (!db) return

  const { error } = await db
    .from("payouts")
    .update({ status: "paid", paid_at: paidAt.toISOString() })
    .eq("id", payoutId)

  if (error) {
    console.error("[payouts] markPayoutPaid:", error.message)
  }
}

/**
 * Marks a payout as `failed` and stores a reason in notes.
 */
export async function markPayoutFailed(payoutId: string, reason: string): Promise<void> {
  const db = createAdminClient()
  if (!db) return

  const { error } = await db
    .from("payouts")
    .update({ status: "failed", notes: reason })
    .eq("id", payoutId)

  if (error) {
    console.error("[payouts] markPayoutFailed:", error.message)
  }
}

// ─── Aggregates ───────────────────────────────────────────────────────────────

/**
 * Returns the total amount pending payout for a user
 * (queued + sent, not yet paid).
 */
export async function getPendingPayoutTotal(userId: string): Promise<number> {
  const db = createAdminClient()
  if (!db) return 0

  const { data, error } = await db
    .from("payouts")
    .select("amount")
    .eq("user_id", userId)
    .in("status", ["queued", "sent"])

  if (error) {
    console.error("[payouts] getPendingPayoutTotal:", error.message)
    return 0
  }

  return (data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0)
}

/**
 * Returns the total amount paid out to a user (lifetime).
 */
export async function getTotalPaidOut(userId: string): Promise<number> {
  const db = createAdminClient()
  if (!db) return 0

  const { data, error } = await db
    .from("payouts")
    .select("amount")
    .eq("user_id", userId)
    .eq("status", "paid")

  if (error) {
    console.error("[payouts] getTotalPaidOut:", error.message)
    return 0
  }

  return (data ?? []).reduce((sum, row) => sum + (row.amount ?? 0), 0)
}
