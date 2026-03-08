import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * pixel_configs — per-member, per-funnel pixel configuration table.
 *
 * Schema: (embudo_id TEXT, member_id TEXT, pixel_id TEXT, pixel_token TEXT, enabled BOOL)
 * Primary key: (embudo_id, member_id)
 *
 * Priority when loading:
 *   1. DB row for (embudo_id, member_id)      ← member's own pixel
 *   2. DB row for (embudo_id, "admin")         ← platform admin pixel for that funnel
 *   3. DB row for ("global", "admin")          ← global admin pixel
 *   4. Env vars                                ← last resort fallback
 */

function db() {
  const client = createAdminClient()
  if (!client) throw new Error("DB not configured")
  return client
}

/**
 * GET /api/pixel/config?embudo_id=franquicia-reset&member_id=username
 */
export async function GET(req: NextRequest) {
  const embudoId = req.nextUrl.searchParams.get("embudo_id") || "global"
  const memberId = req.nextUrl.searchParams.get("member_id") || "admin"

  try {
    const supabase = db()

    // 1. Member's own pixel for this funnel
    const { data: memberRow } = await supabase
      .from("pixel_configs")
      .select("*")
      .eq("embudo_id", embudoId)
      .eq("member_id", memberId)
      .eq("enabled", true)
      .maybeSingle()

    if (memberRow) {
      return NextResponse.json({
        pixel_id: memberRow.pixel_id,
        pixel_token: memberRow.pixel_token || "",
        enabled: true,
        embudo_id: memberRow.embudo_id,
        member_id: memberRow.member_id,
      })
    }

    // 2. Admin pixel for this funnel (fallback)
    if (memberId !== "admin") {
      const { data: adminRow } = await supabase
        .from("pixel_configs")
        .select("*")
        .eq("embudo_id", embudoId)
        .eq("member_id", "admin")
        .eq("enabled", true)
        .maybeSingle()

      if (adminRow) {
        return NextResponse.json({
          pixel_id: adminRow.pixel_id,
          pixel_token: adminRow.pixel_token || "",
          enabled: true,
          embudo_id: embudoId,
          member_id: "admin",
        })
      }
    }

    // 3. Global admin pixel (last DB fallback)
    if (embudoId !== "global") {
      const { data: globalRow } = await supabase
        .from("pixel_configs")
        .select("*")
        .eq("embudo_id", "global")
        .eq("member_id", "admin")
        .eq("enabled", true)
        .maybeSingle()

      if (globalRow) {
        return NextResponse.json({
          pixel_id: globalRow.pixel_id,
          pixel_token: globalRow.pixel_token || "",
          enabled: true,
          embudo_id: "global",
          member_id: "admin",
        })
      }
    }
  } catch {
    // DB unavailable — fall through to env fallback
  }

  // 4. Env fallback
  const envPixelId = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || ""
  return NextResponse.json({
    pixel_id: envPixelId,
    pixel_token: "",
    enabled: !!envPixelId,
    embudo_id: embudoId,
    member_id: memberId,
  })
}

/**
 * POST /api/pixel/config
 * Save (upsert) a pixel config for a member + funnel combination.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { embudo_id = "global", member_id = "admin", pixel_id, pixel_token, enabled = true } = body

    if (!pixel_id?.trim()) {
      return NextResponse.json({ error: "pixel_id es requerido" }, { status: 400 })
    }

    const supabase = db()
    const { data, error } = await supabase
      .from("pixel_configs")
      .upsert(
        {
          embudo_id,
          member_id,
          pixel_id: pixel_id.trim(),
          pixel_token: pixel_token?.trim() || "",
          enabled,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "embudo_id,member_id" }
      )
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

/**
 * DELETE /api/pixel/config?embudo_id=x&member_id=y
 * Disable (soft-delete) a pixel config.
 */
export async function DELETE(req: NextRequest) {
  try {
    const embudoId = req.nextUrl.searchParams.get("embudo_id")
    const memberId = req.nextUrl.searchParams.get("member_id")

    if (!embudoId || !memberId) {
      return NextResponse.json({ error: "embudo_id y member_id requeridos" }, { status: 400 })
    }

    const supabase = db()
    const { error } = await supabase
      .from("pixel_configs")
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq("embudo_id", embudoId)
      .eq("member_id", memberId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
