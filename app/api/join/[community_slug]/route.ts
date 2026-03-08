import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/** GET /api/join/[community_slug]
 * Returns community info + plans with effective prices for the join page.
 * Applies community_price_overrides if present.
 * Optionally applies user_discount if user_id provided via query param.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { community_slug: string } }
) {
  const slug = (params.community_slug ?? "").toLowerCase().trim()
  const userId = req.nextUrl.searchParams.get("user_id") ?? null

  const db = createAdminClient()
  if (!db) {
    return NextResponse.json({ error: "Config error" }, { status: 500 })
  }

  // ── Community ─────────────────────────────────────────────────────────────
  const { data: community } = await db
    .from("communities")
    .select("id, nombre, descripcion, slug, color, activa, allow_trial, default_trial_days, free_trial_days, community_type, platform_trial_days")
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle()

  if (!community || !community.activa) {
    return NextResponse.json({ error: "Comunidad no encontrada" }, { status: 404 })
  }

  // ── Global plans (exclude student – it's not selectable) ──────────────────
  const { data: rawPlans } = await db
    .from("platform_plans")
    .select("code, name, price, annual_price, trial_days, limits, interval")
    .eq("is_active", true)
    .neq("code", "student")
    .order("price", { ascending: true })

  const plans = rawPlans ?? []

  // ── Community price overrides ─────────────────────────────────────────────
  const { data: overrides } = await db
    .from("community_price_overrides")
    .select("plan_code, monthly_price, annual_price")
    .eq("community_id", community.id)
    .eq("is_active", true)

  const overrideMap = new Map<string, { monthly: number; annual: number }>(
    (overrides ?? []).map((o) => [
      o.plan_code,
      {
        monthly: o.monthly_price,
        annual: o.annual_price ?? Math.round(o.monthly_price * 12 * 0.8 * 100) / 100,
      },
    ])
  )

  // ── User discount (optional) ──────────────────────────────────────────────
  let userDiscount: {
    plan_code: string | null
    discount_type: string
    discount_value: number
    billing_scope: string
  } | null = null

  if (userId) {
    const now = new Date().toISOString()
    const { data: discountRow } = await db
      .from("user_discounts")
      .select("plan_code, discount_type, discount_value, billing_scope")
      .eq("user_id", userId)
      .eq("is_active", true)
      .lte("valid_from", now)
      .or(`valid_until.is.null,valid_until.gt.${now}`)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (discountRow) userDiscount = discountRow
  }

  // ── Build effective prices ────────────────────────────────────────────────
  const plansWithPrices = plans.map((plan: any) => {
    const override = overrideMap.get(plan.code)

    let monthly = override ? override.monthly : plan.price
    let annual = override
      ? override.annual
      : (plan.annual_price ?? Math.round(plan.price * 12 * 0.8 * 100) / 100)

    // Apply user discount
    if (
      userDiscount &&
      (userDiscount.plan_code === null || userDiscount.plan_code === plan.code)
    ) {
      const applyMonthly =
        userDiscount.billing_scope === "monthly" || userDiscount.billing_scope === "both"
      const applyAnnual =
        userDiscount.billing_scope === "annual" || userDiscount.billing_scope === "both"

      if (userDiscount.discount_type === "pct") {
        const factor = 1 - userDiscount.discount_value / 100
        if (applyMonthly) monthly = Math.round(monthly * factor * 100) / 100
        if (applyAnnual) annual = Math.round(annual * factor * 100) / 100
      } else {
        if (applyMonthly) monthly = Math.max(0, Math.round((monthly - userDiscount.discount_value) * 100) / 100)
        if (applyAnnual) annual = Math.max(0, Math.round((annual - userDiscount.discount_value) * 100) / 100)
      }
    }

    return {
      code: plan.code,
      name: plan.name,
      trial_days: plan.trial_days,
      limits: plan.limits,
      global_monthly: plan.price,
      global_annual: plan.annual_price,
      effective_monthly: monthly,
      effective_annual: annual,
      has_community_override: overrideMap.has(plan.code),
    }
  })

  return NextResponse.json({
    community: {
      id: community.id,
      nombre: community.nombre,
      descripcion: community.descripcion,
      slug: community.slug ?? community.id,
      color: community.color,
      trial_days: community.default_trial_days ?? community.free_trial_days ?? 7,
      allow_trial: community.allow_trial,
      community_type: (community.community_type as string | null) ?? "team",
      platform_trial_days: (community.platform_trial_days as number | null) ?? 7,
    },
    plans: plansWithPrices,
    user_discount: userDiscount,
  })
}
