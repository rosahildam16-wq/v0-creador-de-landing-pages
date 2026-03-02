import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/** Env-based fallback response */
function envFallback(embudoId: string) {
    return NextResponse.json({
        pixel_id: process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
        enabled: !!(process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID),
        embudo_id: embudoId,
    })
}

/**
 * GET /api/pixel/config?embudo_id=franquicia-reset&member_id=username
 * Uses RPC function to bypass PostgREST schema cache issues.
 */
export async function GET(req: NextRequest) {
    const embudoId = req.nextUrl.searchParams.get("embudo_id") || "global"
    const memberId = req.nextUrl.searchParams.get("member_id") || "admin"

    try {
        const supabase = createAdminClient()
        if (!supabase) return envFallback(embudoId)

        // Use RPC function (bypasses schema cache)
        const { data, error } = await supabase.rpc("get_pixel_config", {
            p_embudo_id: embudoId,
            p_member_id: memberId,
        })

        if (error) {
            console.error("Pixel config RPC error:", error.message)
            return envFallback(embudoId)
        }

        if (data && data.pixel_id) {
            return NextResponse.json({
                pixel_id: data.pixel_id,
                pixel_token: data.pixel_token || "",
                enabled: data.enabled,
                embudo_id: data.embudo_id,
                member_id: data.member_id,
            })
        }

        return envFallback(embudoId)
    } catch {
        return envFallback(embudoId)
    }
}

/**
 * POST /api/pixel/config
 * Save pixel config using RPC function (bypasses schema cache).
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const body = await req.json()
        const { embudo_id = "global", member_id = "admin", pixel_id, pixel_token, enabled = true } = body

        if (!pixel_id) return NextResponse.json({ error: "pixel_id is required" }, { status: 400 })

        // Use RPC function (bypasses schema cache)
        const { data, error } = await supabase.rpc("upsert_pixel_config", {
            p_embudo_id: embudo_id,
            p_member_id: member_id,
            p_pixel_id: pixel_id,
            p_pixel_token: pixel_token || "",
            p_enabled: enabled,
        })

        if (error) {
            console.error("Pixel config upsert RPC error:", error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/**
 * PUT /api/pixel/config
 * List all pixel configs — uses direct query with fallback.
 */
export async function PUT(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ configs: [] })

        // Try direct query first
        const { data, error } = await supabase
            .from("pixel_config")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Pixel config list error:", error.message)
            return NextResponse.json({ configs: [] })
        }

        return NextResponse.json({ configs: data || [] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message, configs: [] })
    }
}
