import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/server/admin-guard"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/pricing/overrides
 * Returns all community price overrides.
 * Query: ?community_id=xxx (optional filter)
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const communityId = request.nextUrl.searchParams.get("community_id")

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "Config error" }, { status: 500 })

  let query = db
    .from("community_price_overrides")
    .select("*, communities(nombre), platform_plans(name, price)")
    .order("created_at", { ascending: false })

  if (communityId) query = query.eq("community_id", communityId)

  const { data, error } = await query

  if (error) {
    console.error("[pricing/overrides GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ overrides: data ?? [] })
}

/**
 * POST /api/admin/pricing/overrides
 * Creates or updates a community price override (upsert on community_id + plan_code).
 *
 * Body: { community_id, plan_code, monthly_price, annual_price?, note? }
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  let body: {
    community_id?: string
    plan_code?: string
    monthly_price?: number
    annual_price?: number | null
    note?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { community_id, plan_code, monthly_price, annual_price, note } = body

  if (!community_id || !plan_code || monthly_price === undefined || monthly_price < 0) {
    return NextResponse.json(
      { error: "Se requieren: community_id, plan_code, monthly_price (>= 0)" },
      { status: 400 }
    )
  }

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "Config error" }, { status: 500 })

  const { data, error } = await db
    .from("community_price_overrides")
    .upsert(
      {
        community_id,
        plan_code,
        monthly_price,
        annual_price: annual_price ?? null,
        note: note ?? null,
        created_by: guard.user?.memberId ?? "admin",
        is_active: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "community_id,plan_code" }
    )
    .select()
    .single()

  if (error) {
    console.error("[pricing/overrides POST]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ override: data }, { status: 201 })
}

/**
 * DELETE /api/admin/pricing/overrides
 * Deactivates (soft-delete) a community price override.
 *
 * Body: { community_id, plan_code }
 */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  let body: { community_id?: string; plan_code?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body.community_id || !body.plan_code) {
    return NextResponse.json({ error: "Se requieren: community_id, plan_code" }, { status: 400 })
  }

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "Config error" }, { status: 500 })

  const { error } = await db
    .from("community_price_overrides")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("community_id", body.community_id)
    .eq("plan_code", body.plan_code)

  if (error) {
    console.error("[pricing/overrides DELETE]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
