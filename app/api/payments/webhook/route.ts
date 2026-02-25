import { NextRequest, NextResponse } from "next/server"
import { verifyIPN } from "@/lib/nowpayments"
import {
  activateSubscription,
  recordPayment,
  getSubscriptionById,
} from "@/lib/subscription-data"
import type { NowPaymentsIPNPayload } from "@/lib/subscription-types"

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get("x-nowpayments-sig")
    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 401 })
    }

    const payload = (await request.json()) as NowPaymentsIPNPayload

    // Verify IPN signature
    if (!process.env.NOWPAYMENTS_IPN_SECRET) {
      console.warn("NOWPAYMENTS_IPN_SECRET not configured, skipping verification")
    } else {
      const isValid = verifyIPN(payload as unknown as Record<string, unknown>, signature)
      if (!isValid) {
        console.error("Invalid IPN signature")
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }

    // Extract subscription ID from order_id (format: sub_{subscriptionId}_{timestamp})
    const orderParts = payload.order_id?.split("_") ?? []
    const subscriptionId = orderParts.length >= 2 ? orderParts[1] : null

    if (!subscriptionId) {
      console.error("Could not extract subscription ID from order:", payload.order_id)
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 })
    }

    // Get the subscription
    const subscription = await getSubscriptionById(subscriptionId)
    if (!subscription) {
      console.error("Subscription not found:", subscriptionId)
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 })
    }

    // Record the payment
    await recordPayment({
      subscriptionId,
      nowpaymentsPaymentId: String(payload.payment_id),
      nowpaymentsInvoiceId: payload.invoice_id ? String(payload.invoice_id) : undefined,
      nowpaymentsOrderId: payload.order_id,
      amountUsdt: payload.price_amount,
      status: payload.payment_status,
      payAddress: payload.pay_address,
      network: payload.network,
    })

    // If payment is finished, activate the subscription
    if (payload.payment_status === "finished") {
      await activateSubscription({
        subscriptionId,
        nowpaymentsPaymentId: String(payload.payment_id),
      })
      console.log(`Subscription ${subscriptionId} activated via IPN`)
    }

    return NextResponse.json({ status: "ok" })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
