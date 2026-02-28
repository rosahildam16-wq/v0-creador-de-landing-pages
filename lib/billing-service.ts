import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Core billing logic for Magic Funnel.
 * Prepares the system for multi-gateway support (Alivio, Stripe, etc.)
 */

export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled" | "none"

export async function getUserSubscriptionStatus(email: string): Promise<SubscriptionStatus> {
    const supabase = createAdminClient()
    if (!supabase) return "trial" // Safe fallback during setup

    const { data, error } = await supabase
        .from("subscriptions")
        .select("status, trial_ends_at")
        .eq("user_email", email.toLowerCase().trim())
        .maybeSingle()

    if (error || !data) return "none"

    // Check if trial is expired
    if (data.status === "trial") {
        const now = new Date()
        const trialEnd = new Date(data.trial_ends_at)
        if (now > trialEnd) return "past_due"
    }

    return data.status as SubscriptionStatus
}

/**
 * Activates or Renews a subscription based on a payment event.
 */
export async function processSuccessfulPayment(email: string, planId: string, reference: string) {
    const supabase = createAdminClient()
    if (!supabase) return

    const now = new Date().toISOString()

    // Update or Insert subscription
    const { error } = await supabase
        .from("subscriptions")
        .upsert({
            user_email: email.toLowerCase().trim(),
            plan_id: planId,
            status: "active",
            last_payment_at: now,
            external_reference: reference,
            updated_at: now
        }, { onConflict: "user_email" })

    if (error) console.error("Error processing payment in DB:", error)
}
