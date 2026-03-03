import { NextRequest, NextResponse } from "next/server"
import { verifyAlivioWebhook } from "@/lib/alivio"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/payments/alivio-webhook
 * Handles payment events from Alivio Payment Gateway
 * 
 * Events:
 * - payment.created   → Nuevo pago iniciado
 * - payment.waiting   → Esperando pago del cliente
 * - payment.confirming → Pago recibido, confirmando
 * - payment.finished  → Pago completado exitosamente ✅
 * - payment.failed    → Pago fallido ❌
 * - payment.expired   → Pago expirado ⏰
 */
export async function POST(request: NextRequest) {
    try {
        const rawBody = await request.text()
        const signature = request.headers.get("x-webhook-signature") || ""

        // Verify webhook signature
        if (!verifyAlivioWebhook(rawBody, signature)) {
            console.error("Invalid Alivio webhook signature")
            return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
        }

        const event = JSON.parse(rawBody)
        const eventType = event.event || event.type
        const payment = event.data?.payment || event.payment || event.data || {}

        console.log(`[Alivio Webhook] Event: ${eventType}`, {
            paymentId: payment.id,
            orderId: payment.orderId,
            status: payment.status,
            amount: payment.amount,
        })

        // Extract subscription info from orderId (format: sub_{subscriptionId}_{timestamp})
        const orderId = payment.orderId || ""
        const subscriptionIdMatch = orderId.match(/^sub_(.+)_\d+$/)
        const subscriptionId = subscriptionIdMatch?.[1]

        const supabase = createAdminClient()

        switch (eventType) {
            case "payment.finished": {
                // ✅ Payment completed - activate subscription
                console.log("[Alivio] Payment completed!", { orderId, subscriptionId })

                if (supabase && subscriptionId) {
                    // Update subscription to active
                    const { error } = await supabase
                        .from("subscriptions")
                        .update({
                            status: "active",
                            payment_id: payment.id,
                            payment_method: "alivio",
                            paid_at: new Date().toISOString(),
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", subscriptionId)

                    if (error) {
                        console.error("Error activating subscription:", error)
                    } else {
                        console.log(`Subscription ${subscriptionId} activated!`)
                    }

                    // Log the transaction
                    await supabase.from("payment_transactions").insert({
                        subscription_id: subscriptionId,
                        payment_id: payment.id,
                        amount: payment.amount,
                        currency: payment.currency || "USD",
                        status: "completed",
                        provider: "alivio",
                        order_id: orderId,
                        raw_data: payment,
                    }).catch(() => { })
                }
                break
            }

            case "payment.failed": {
                // ❌ Payment failed
                console.log("[Alivio] Payment failed", { orderId })
                if (supabase && subscriptionId) {
                    await supabase
                        .from("subscriptions")
                        .update({
                            status: "payment_failed",
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", subscriptionId)
                        .catch(() => { })
                }
                break
            }

            case "payment.expired": {
                // ⏰ Payment expired
                console.log("[Alivio] Payment expired", { orderId })
                if (supabase && subscriptionId) {
                    await supabase
                        .from("subscriptions")
                        .update({
                            status: "expired",
                            updated_at: new Date().toISOString(),
                        })
                        .eq("id", subscriptionId)
                        .catch(() => { })
                }
                break
            }

            case "payment.waiting":
            case "payment.confirming":
            case "payment.created": {
                // Informational events - just log
                console.log(`[Alivio] ${eventType}`, { orderId })
                break
            }

            default:
                console.log(`[Alivio] Unknown event: ${eventType}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error("Alivio webhook error:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}
