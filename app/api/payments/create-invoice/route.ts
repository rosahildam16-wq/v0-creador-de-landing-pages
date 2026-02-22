import { NextRequest, NextResponse } from "next/server"
import { createInvoice } from "@/lib/nowpayments"
import { getPlan, getSubscription, createTrialSubscription } from "@/lib/subscription-data"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, userRole, planId, paidBy } = body

    if (!userEmail || !planId) {
      return NextResponse.json(
        { error: "Se requiere userEmail y planId" },
        { status: 400 }
      )
    }

    // Get the plan details
    const plan = await getPlan(planId)
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    // Check if user already has a subscription
    let subscription = await getSubscription(userEmail)

    // If no subscription exists, create a trial first
    if (!subscription) {
      subscription = await createTrialSubscription({
        userEmail,
        userRole: userRole || "admin",
        planId,
        paidBy,
      })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const orderId = `sub_${subscription.id}_${Date.now()}`

    // Check if NOWPayments is configured
    if (!process.env.NOWPAYMENTS_API_KEY) {
      // Return a mock response for development
      return NextResponse.json({
        invoiceUrl: `${baseUrl}/pricing/status?subscription_id=${subscription.id}&demo=true`,
        orderId,
        subscriptionId: subscription.id,
        demo: true,
        message: "NOWPayments no esta configurado. Agrega NOWPAYMENTS_API_KEY para habilitar pagos reales.",
      })
    }

    // Create invoice on NOWPayments
    const invoice = await createInvoice({
      priceAmount: plan.precio_usdt,
      orderId,
      orderDescription: `MagicFunnel - Plan ${plan.nombre} (${plan.periodo})`,
      successUrl: `${baseUrl}/pricing/status?subscription_id=${subscription.id}&status=success`,
      cancelUrl: `${baseUrl}/pricing?cancelled=true`,
      ipnCallbackUrl: `${baseUrl}/api/payments/webhook`,
    })

    return NextResponse.json({
      invoiceUrl: invoice.invoice_url,
      invoiceId: invoice.id,
      orderId,
      subscriptionId: subscription.id,
    })
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }
    )
  }
}
