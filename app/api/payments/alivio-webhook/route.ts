import { NextRequest, NextResponse } from "next/server"
import { verifyAlivioWebhook } from "@/lib/alivio"
import { activateSubscription, recordPayment, getSubscriptionById } from "@/lib/subscription-data"

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

        switch (eventType) {
            case "payment.finished": {
                // ✅ Payment completed — activate subscription
                console.log("[Alivio] Payment completed!", { orderId, subscriptionId })

                if (subscriptionId) {
                    // Verify subscription exists
                    const subscription = await getSubscriptionById(subscriptionId)
                    if (!subscription) {
                        console.error("Subscription not found:", subscriptionId)
                        return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
                    }

                    // Activate the subscription
                    await activateSubscription({
                        subscriptionId,
                        paymentId: payment.id,
                        paymentMethod: "alivio",
                    })
                    console.log(`Subscription ${subscriptionId} activated!`)

                    // Record the transaction
                    await recordPayment({
                        subscriptionId,
                        providerPaymentId: payment.id,
                        providerOrderId: orderId,
                        provider: "alivio",
                        amountUsdt: payment.amount || 0,
                        status: "finished",
                        rawData: payment,
                    })
                }
                break
            }

            case "payment.failed": {
                // ❌ Payment failed
                console.log("[Alivio] Payment failed", { orderId, subscriptionId })
                if (subscriptionId) {
                    await recordPayment({
                        subscriptionId,
                        providerPaymentId: payment.id || `failed_${Date.now()}`,
                        providerOrderId: orderId,
                        provider: "alivio",
                        amountUsdt: payment.amount || 0,
                        status: "failed",
                        rawData: payment,
                    })
                }
                break
            }

            case "payment.expired": {
                // ⏰ Payment expired
                console.log("[Alivio] Payment expired", { orderId, subscriptionId })
                if (subscriptionId) {
                    await recordPayment({
                        subscriptionId,
                        providerPaymentId: payment.id || `expired_${Date.now()}`,
                        providerOrderId: orderId,
                        provider: "alivio",
                        amountUsdt: payment.amount || 0,
                        status: "expired",
                        rawData: payment,
                    })
                }
                break
            }

            case "payment.waiting":
            case "payment.confirming":
            case "payment.created": {
                // Informational events — just log
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
