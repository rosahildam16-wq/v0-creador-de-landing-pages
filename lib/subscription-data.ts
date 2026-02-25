import { createAdminClient } from "@/lib/supabase/admin"
import type { Subscription, SubscriptionPlan } from "@/lib/subscription-types"

/**
 * Get all active subscription plans.
 */
export async function getPlans(): Promise<SubscriptionPlan[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("activo", true)
    .order("precio_usdt", { ascending: true })

  if (error) throw new Error(`Error fetching plans: ${error.message}`)
  return (data ?? []) as SubscriptionPlan[]
}

/**
 * Get a single plan by ID.
 */
export async function getPlan(planId: string): Promise<SubscriptionPlan | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", planId)
    .single()

  if (error) return null
  return data as SubscriptionPlan
}

/**
 * Get active subscription for a user email.
 */
export async function getSubscription(userEmail: string): Promise<Subscription | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("user_email", userEmail.toLowerCase())
    .in("status", ["trial", "active", "pending_payment"])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (error) return null
  return data as Subscription
}

/**
 * Get subscription by ID (for webhook updates).
 */
export async function getSubscriptionById(id: string): Promise<Subscription | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("id", id)
    .single()

  if (error) return null
  return data as Subscription
}

/**
 * Check if a user has valid access (trial or active subscription).
 */
export async function hasValidAccess(userEmail: string): Promise<{
  hasAccess: boolean
  subscription: Subscription | null
  reason: string
}> {
  const sub = await getSubscription(userEmail)

  if (!sub) {
    return { hasAccess: false, subscription: null, reason: "no_subscription" }
  }

  if (sub.status === "trial") {
    const trialEnd = sub.trial_ends_at ? new Date(sub.trial_ends_at) : null
    if (trialEnd && trialEnd > new Date()) {
      return { hasAccess: true, subscription: sub, reason: "trial_active" }
    }
    return { hasAccess: false, subscription: sub, reason: "trial_expired" }
  }

  if (sub.status === "active") {
    const periodEnd = sub.current_period_end ? new Date(sub.current_period_end) : null
    if (periodEnd && periodEnd > new Date()) {
      return { hasAccess: true, subscription: sub, reason: "subscription_active" }
    }
    return { hasAccess: false, subscription: sub, reason: "subscription_expired" }
  }

  if (sub.status === "pending_payment") {
    return { hasAccess: false, subscription: sub, reason: "pending_payment" }
  }

  return { hasAccess: false, subscription: sub, reason: "unknown" }
}

/**
 * Create a trial subscription for a new user.
 */
export async function createTrialSubscription(params: {
  userEmail: string
  userRole: "admin" | "member"
  planId: string
  paidBy?: string
}): Promise<Subscription> {
  const supabase = createAdminClient()
  const now = new Date()
  const trialEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) // 3 days

  const { data, error } = await supabase
    .from("subscriptions")
    .insert({
      user_email: params.userEmail.toLowerCase(),
      user_role: params.userRole,
      plan_id: params.planId,
      status: "trial",
      trial_starts_at: now.toISOString(),
      trial_ends_at: trialEnd.toISOString(),
      paid_by: params.paidBy || null,
    })
    .select("*, plan:subscription_plans(*)")
    .single()

  if (error) throw new Error(`Error creating trial: ${error.message}`)
  return data as Subscription
}

/**
 * Activate a subscription after successful payment.
 */
export async function activateSubscription(params: {
  subscriptionId: string
  nowpaymentsPaymentId: string
}): Promise<Subscription> {
  const supabase = createAdminClient()
  const now = new Date()
  const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

  const { data, error } = await supabase
    .from("subscriptions")
    .update({
      status: "active",
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      nowpayments_payment_id: params.nowpaymentsPaymentId,
      updated_at: now.toISOString(),
    })
    .eq("id", params.subscriptionId)
    .select("*, plan:subscription_plans(*)")
    .single()

  if (error) throw new Error(`Error activating subscription: ${error.message}`)
  return data as Subscription
}

/**
 * Record a payment in the payments table.
 */
export async function recordPayment(params: {
  subscriptionId: string
  nowpaymentsPaymentId: string
  nowpaymentsInvoiceId?: string
  nowpaymentsOrderId?: string
  amountUsdt: number
  status: string
  payAddress?: string
  network?: string
}) {
  const supabase = createAdminClient()

  const { error } = await supabase.from("payments").upsert(
    {
      subscription_id: params.subscriptionId,
      nowpayments_payment_id: params.nowpaymentsPaymentId,
      nowpayments_invoice_id: params.nowpaymentsInvoiceId || null,
      nowpayments_order_id: params.nowpaymentsOrderId || null,
      amount_usdt: params.amountUsdt,
      status: params.status,
      pay_address: params.payAddress || null,
      network: params.network || null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "nowpayments_payment_id" }
  )

  if (error) throw new Error(`Error recording payment: ${error.message}`)
}

/**
 * Expire a subscription.
 */
export async function expireSubscription(subscriptionId: string) {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("subscriptions")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("id", subscriptionId)

  if (error) throw new Error(`Error expiring subscription: ${error.message}`)
}

/**
 * Get all subscriptions paid by a specific admin (for team management).
 */
export async function getTeamSubscriptions(adminEmail: string): Promise<Subscription[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*, plan:subscription_plans(*)")
    .eq("paid_by", adminEmail.toLowerCase())
    .in("status", ["trial", "active", "pending_payment"])
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Error fetching team subs: ${error.message}`)
  return (data ?? []) as Subscription[]
}

/**
 * Get payment history for a subscription.
 */
export async function getPaymentHistory(subscriptionId: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("subscription_id", subscriptionId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(`Error fetching payments: ${error.message}`)
  return data ?? []
}
