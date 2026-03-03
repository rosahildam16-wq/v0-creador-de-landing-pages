import { NextRequest, NextResponse } from "next/server"
import { createAlivioPayment, ALIVIO_PLANS } from "@/lib/alivio"
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

    // Get plan amount from Alivio plans config
    const alivioPlan = ALIVIO_PLANS[planId]
    const amount = alivioPlan?.amount || plan.precio_usdt || 27

    // Check if Alivio is configured
    if (!process.env.ALIVIO_API_KEY) {
      // Return a mock response for development
      return NextResponse.json({
        invoiceUrl: `${baseUrl}/pricing/status?subscription_id=${subscription.id}&demo=true`,
        orderId,
        subscriptionId: subscription.id,
        demo: true,
        message: "Alivio no está configurado. Agrega ALIVIO_API_KEY para habilitar pagos reales.",
      })
    }

    // Create payment on Alivio
    const result = await createAlivioPayment({
      amount,
      currency: "USD",
      orderId,
      customerEmail: userEmail,
      metadata: {
        planId,
        planName: alivioPlan?.name || plan.nombre,
        subscriptionId: subscription.id,
        userRole,
        successUrl: `${baseUrl}/pricing/status?subscription_id=${subscription.id}&status=success`,
        cancelUrl: `${baseUrl}/pricing?cancelled=true`,
      },
    })

    const paymentData = result.data?.payment

    return NextResponse.json({
      invoiceUrl: paymentData?.paymentUrl || `${baseUrl}/pricing/status?subscription_id=${subscription.id}&payment_id=${paymentData?.id}`,
      paymentId: paymentData?.id,
      orderId,
      subscriptionId: subscription.id,
      provider: "alivio",
    })
  } catch (error) {
    console.error("Error creating Alivio payment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }
    )
  }
}
