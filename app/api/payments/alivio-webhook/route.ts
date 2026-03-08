import { NextRequest, NextResponse } from "next/server"
import { verifyAlivioWebhook } from "@/lib/alivio"
import { activateSubscription, recordPayment, getSubscriptionById } from "@/lib/subscription-data"
import { createAdminClient } from "@/lib/supabase/admin"
import { recordCommission } from "@/lib/server/commissions"

/**
 * POST /api/payments/alivio-webhook
 * Handles payment events from Alivio Payment Gateway
 *
 * Events:
 * - payment.created    → Nuevo pago iniciado
 * - payment.waiting    → Esperando pago del cliente
 * - payment.confirming → Pago recibido, confirmando
 * - payment.finished   → Pago completado exitosamente ✅
 * - payment.failed     → Pago fallido ❌
 * - payment.expired    → Pago expirado ⏰
 *
 * On payment.finished:
 *  1. Activates legacy subscriptions row (backwards-compat)
 *  2. Activates user_platform_subscription (new schema)
 *  3. Calls recordCommission() to create L1/L2 commission rows
 *
 * orderId format: mf_{userId}_{planCode}_{billingInterval}_{timestamp}
 * Legacy format:  sub_{subscriptionId}_{timestamp}
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

        const orderId = payment.orderId || ""

        // ── New orderId format: mf_{userId}_{planCode}_{billingInterval}_{ts}
        const newFormatMatch = orderId.match(/^mf_(.+)_(plan_\w+|plan_300)_(monthly|annual)_\d+$/)
        // ── Legacy orderId format: sub_{subscriptionId}_{timestamp}
        const legacyMatch = orderId.match(/^sub_(.+)_\d+$/)

        switch (eventType) {
            case "payment.finished": {
                console.log("[Alivio] Payment completed!", { orderId })

                // ── Handle NEW format ──────────────────────────────────────────
                if (newFormatMatch) {
                    const userId = newFormatMatch[1]
                    const planCode = newFormatMatch[2]
                    const billingInterval = newFormatMatch[3] as "monthly" | "annual"
                    const grossAmount = payment.amount || 0

                    const db = createAdminClient()
                    if (db) {
                        const now = new Date()
                        const periodEnd = new Date(now)
                        if (billingInterval === "annual") {
                            periodEnd.setFullYear(periodEnd.getFullYear() + 1)
                        } else {
                            periodEnd.setMonth(periodEnd.getMonth() + 1)
                        }

                        // Activate user_platform_subscription
                        await db.from("user_platform_subscription").upsert(
                            {
                                user_id: userId,
                                platform_plan_code: planCode,
                                billing_interval: billingInterval,
                                status: "active",
                                trial_start: null,
                                trial_end: null,
                                current_period_start: now.toISOString(),
                                current_period_end: periodEnd.toISOString(),
                                downgrade_to_student_at: null,
                                updated_at: now.toISOString(),
                            },
                            { onConflict: "user_id" }
                        )

                        // Record commission (non-blocking — errors logged but won't fail webhook)
                        recordCommission({
                            payerUserId: userId,
                            platformPlanCode: planCode,
                            grossAmount,
                            currency: "USD",
                            periodStart: now,
                            periodEnd,
                            metadata: {
                                source: "alivio_webhook",
                                payment_id: payment.id,
                                order_id: orderId,
                                billing_interval: billingInterval,
                            },
                        }).catch((e) => console.error("[Alivio] recordCommission error:", e))

                        console.log(`[Alivio] user_platform_subscription activated for ${userId} → ${planCode} (${billingInterval})`)
                    }
                    break
                }

                // ── Handle LEGACY format ───────────────────────────────────────
                if (legacyMatch) {
                    const subscriptionId = legacyMatch[1]
                    const subscription = await getSubscriptionById(subscriptionId)
                    if (!subscription) {
                        console.error("Subscription not found:", subscriptionId)
                        return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
                    }

                    const metadata = payment.metadata || {}
                    const billingPeriod = metadata.billingPeriod === "anual" ? "anual" as const : "mensual" as const

                    await activateSubscription({
                        subscriptionId,
                        paymentId: payment.id,
                        paymentMethod: "alivio",
                        billingPeriod,
                    })

                    await recordPayment({
                        subscriptionId,
                        providerPaymentId: payment.id,
                        providerOrderId: orderId,
                        provider: "alivio",
                        amountUsdt: payment.amount || 0,
                        status: "finished",
                        rawData: payment,
                    })
                    console.log(`[Alivio] Legacy subscription ${subscriptionId} activated`)
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
