import { NextRequest, NextResponse } from "next/server"
import { createAlivioPayment, ALIVIO_PLANS } from "@/lib/alivio"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Resolve a plan from ALIVIO_PLANS.
 * Supports:
 *  - Direct keys: "basico", "pro-anual"
 *  - UUID from subscription_plans table (looks up nombre → maps to key)
 */
async function resolveAlivioPlan(planId: string) {
  // 1. Try direct key match
  if (ALIVIO_PLANS[planId]) {
    return { plan: ALIVIO_PLANS[planId], resolvedKey: planId }
  }

  // 2. If it looks like a UUID, look up in subscription_plans table
  if (planId.length > 10 && planId.includes("-")) {
    const supabase = createAdminClient()
    if (supabase) {
      const { data } = await supabase
        .from("subscription_plans")
        .select("id, nombre, precio_usdt")
        .eq("id", planId)
        .single()

      if (data) {
        // Map nombre to ALIVIO_PLANS key
        const nameToKey: Record<string, string> = {
          "basico": "basico",
          "básico": "basico",
          "plan basico": "basico",
          "plan básico": "basico",
          "pro": "pro",
          "plan pro": "pro",
          "elite": "elite",
          "plan elite": "elite",
        }

        const key = nameToKey[data.nombre.toLowerCase()] || null

        if (key && ALIVIO_PLANS[key]) {
          return { plan: ALIVIO_PLANS[key], resolvedKey: key }
        }

        // Fallback: create a plan from DB data
        return {
          plan: { name: data.nombre, amount: data.precio_usdt, period: "mensual" },
          resolvedKey: key || "basico"
        }
      }
    }
  }

  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userEmail, userRole, planId, billingPeriod } = body

    if (!userEmail || !planId) {
      return NextResponse.json(
        { error: "Se requiere userEmail y planId" },
        { status: 400 }
      )
    }

    // Resolve plan — supports direct keys ("pro", "pro-anual") and UUIDs
    const resolved = await resolveAlivioPlan(planId)
    if (!resolved) {
      return NextResponse.json({ error: "Plan no encontrado" }, { status: 404 })
    }

    const { plan, resolvedKey } = resolved

    // If annual billing was selected but the planId wasn't already annual,
    // try to get the annual version
    let finalPlan = plan
    let finalKey = resolvedKey
    if (billingPeriod === "anual" && !resolvedKey.includes("-anual")) {
      const annualKey = `${resolvedKey}-anual`
      if (ALIVIO_PLANS[annualKey]) {
        finalPlan = ALIVIO_PLANS[annualKey]
        finalKey = annualKey
      }
    }

    // For subscription record, use the base plan id
    const basePlanId = finalKey.replace("-anual", "")

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
    const orderId = `sub_${basePlanId}_${Date.now()}`

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
      amount: finalPlan.amount,
      currency: "USD",
      orderId,
      customerEmail: userEmail,
      metadata: {
        planId: finalKey,
        basePlanId,
        planName: finalPlan.name,
        billingPeriod: billingPeriod || finalPlan.period,
        successUrl: `${baseUrl}/pricing/status?status=success&plan=${basePlanId}`,
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
