import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/server/admin-guard"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/**
 * GET /api/admin/pricing/discounts
 * Returns all user discounts.
 * Query: ?user_id=xxx (optional)
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const userId = request.nextUrl.searchParams.get("user_id")

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "Config error" }, { status: 500 })

  let query = db
    .from("user_discounts")
    .select("*")
    .order("created_at", { ascending: false })

  if (userId) query = query.eq("user_id", userId)

  const { data, error } = await query

  if (error) {
    console.error("[pricing/discounts GET]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ discounts: data ?? [] })
}

/**
 * POST /api/admin/pricing/discounts
 * Creates a new user discount.
 *
 * Body: {
 *   user_id, plan_code?, discount_type, discount_value,
 *   billing_scope?, valid_from?, valid_until?, max_uses?, reason
 * }
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  let body: {
    user_id?: string
    plan_code?: string | null
    discount_type?: string
    discount_value?: number
    billing_scope?: string
    valid_from?: string
    valid_until?: string | null
    max_uses?: number | null
    reason?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const {
    user_id,
    plan_code = null,
    discount_type = "pct",
    discount_value,
    billing_scope = "both",
    valid_from,
    valid_until = null,
    max_uses = null,
    reason,
  } = body

  if (!user_id || discount_value === undefined || discount_value < 0) {
    return NextResponse.json(
      { error: "Se requieren: user_id, discount_value (>= 0)" },
      { status: 400 }
    )
  }

  if (!["pct", "fixed"].includes(discount_type)) {
    return NextResponse.json({ error: "discount_type debe ser 'pct' o 'fixed'" }, { status: 400 })
  }

  if (discount_type === "pct" && discount_value > 100) {
    return NextResponse.json({ error: "Un descuento porcentual no puede superar 100%" }, { status: 400 })
  }

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "Config error" }, { status: 500 })

  const { data, error } = await db
    .from("user_discounts")
    .insert({
      user_id,
      plan_code: plan_code ?? null,
      discount_type,
      discount_value,
      billing_scope,
      valid_from: valid_from ?? new Date().toISOString(),
      valid_until: valid_until ?? null,
      max_uses: max_uses ?? null,
      reason: reason ?? null,
      created_by: guard.user?.memberId ?? "admin",
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error("[pricing/discounts POST]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ discount: data }, { status: 201 })
}

/**
 * DELETE /api/admin/pricing/discounts
 * Revokes a user discount by ID.
 *
 * Body: { id }
 */
export async function DELETE(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  let body: { id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body.id) {
    return NextResponse.json({ error: "Se requiere: id" }, { status: 400 })
  }

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "Config error" }, { status: 500 })

  const { error } = await db
    .from("user_discounts")
    .update({
      is_active: false,
      revoked_by: guard.user?.memberId ?? "admin",
      revoked_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", body.id)

  if (error) {
    console.error("[pricing/discounts DELETE]", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
