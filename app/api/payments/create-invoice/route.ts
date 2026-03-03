import { NextRequest, NextResponse } from "next/server"
import { createAlivioPayment, ALIVIO_PLANS } from "@/lib/alivio"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, planId } = body

    if (!userEmail || !planId) {
      return NextResponse.json(
        { error: "Se requiere userEmail y planId" },
        { status: 400 }
      )
    }

    // Get plan from our config
    const plan = ALIVIO_PLANS[planId]
    if (!plan) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const orderId = `mf_${planId}_${Date.now()}`

    // Check if Alivio is configured
    if (!process.env.ALIVIO_API_KEY) {
      return NextResponse.json({
        invoiceUrl: `${baseUrl}/pricing/status?demo=true`,
        orderId,
        demo: true,
        message: "Alivio no está configurado. Agrega ALIVIO_API_KEY.",
      })
    }

    // Create payment on Alivio
    const result = await createAlivioPayment({
      amount: plan.amount,
      currency: "USD",
      orderId,
      customerEmail: userEmail,
      metadata: {
        planId,
        planName: plan.name,
        successUrl: `${baseUrl}/pricing/status?status=success&plan=${planId}`,
        cancelUrl: `${baseUrl}/pricing?cancelled=true`,
      },
    })

    const paymentData = result.data?.payment

    return NextResponse.json({
      invoiceUrl: paymentData?.paymentUrl || paymentData?.payment_url || `${baseUrl}/pricing/status?payment_id=${paymentData?.id}&status=pending`,
      paymentId: paymentData?.id,
      orderId,
      provider: "alivio",
    })
  } catch (error) {
    console.error("Error creating payment:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error creando pago" },
      { status: 500 }
    )
  }
}
