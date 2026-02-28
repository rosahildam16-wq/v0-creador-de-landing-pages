import { createAdminClient } from "@/lib/supabase/admin"
import { NextRequest, NextResponse } from "next/server"

/**
 * Webhook handler for Alivio Finance
 * Documentation: https://aliviotech.com/ (API REST)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json()
        const signature = req.headers.get("x-alivio-signature") // Example header

        // 1. Verify Signature (Security)
        // TODO: Implement signature verification when secret is available

        const { event, data } = body

        console.log(`[ALIVIO WEBHOOK] Event: ${event}`, data)

        const supabase = createAdminClient()
        if (!supabase) throw new Error("Supabase client not available")

        // 2. Handle Events
        switch (event) {
            case "payment.succeeded":
                const userEmail = data.customer_email || data.email
                const amount = data.amount
                const reference = data.reference

                // Update subscription status
                await supabase
                    .from("subscriptions")
                    .update({
                        status: "active",
                        last_payment_at: new Date().toISOString(),
                        external_reference: reference
                    })
                    .eq("user_email", userEmail)

                // Notify the user or log activity
                break

            case "payment.failed":
                // Handle failed payment (e.g., notify user)
                break

            default:
                console.log("Unhandled Alivio event:", event)
        }

        // Log the transaction for audit
        await supabase.from("payment_logs").insert({
            provider: "alivio",
            event_type: event,
            payload: body,
            success: true
        })

        return NextResponse.json({ received: true })
    } catch (err: any) {
        console.error("Alivio Webhook Error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
