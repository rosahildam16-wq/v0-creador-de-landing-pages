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
 * Returns pixel config with cascading fallback: member → admin → global → env.
 */
export async function GET(req: NextRequest) {
    const embudoId = req.nextUrl.searchParams.get("embudo_id") || "global"
    const memberId = req.nextUrl.searchParams.get("member_id") || "admin"

    try {
        const supabase = createAdminClient()
        if (!supabase) return envFallback(embudoId)

        // 1. Try specific member + embudo config
        const { data: memberData, error } = await supabase
            .from("pixel_configs")
            .select("*")
            .eq("embudo_id", embudoId)
            .eq("member_id", memberId)
            .maybeSingle()

        if (error) {
            console.error("Pixel GET error:", error.message)
            return envFallback(embudoId)
        }

        if (memberData && memberData.enabled) {
            return NextResponse.json({
                pixel_id: memberData.pixel_id,
                pixel_token: memberData.pixel_token || "",
                enabled: memberData.enabled,
                embudo_id: memberData.embudo_id,
                member_id: memberData.member_id,
            })
        }

        // 2. Fallback to admin's config for this funnel
        if (memberId !== "admin") {
            const { data: adminConfig } = await supabase
                .from("pixel_configs")
                .select("*")
                .eq("embudo_id", embudoId)
                .eq("member_id", "admin")
                .maybeSingle()

            if (adminConfig && adminConfig.enabled) {
                return NextResponse.json({
                    pixel_id: adminConfig.pixel_id,
                    pixel_token: adminConfig.pixel_token || "",
                    enabled: adminConfig.enabled,
                    embudo_id: embudoId,
                    member_id: "admin",
                })
            }
        }

        // 3. Fallback to global app config
        if (embudoId !== "global") {
            const { data: globalConfig } = await supabase
                .from("pixel_configs")
                .select("*")
                .eq("embudo_id", "global")
                .eq("member_id", "admin")
                .maybeSingle()

            if (globalConfig && globalConfig.enabled) {
                return NextResponse.json({
                    pixel_id: globalConfig.pixel_id,
                    pixel_token: globalConfig.pixel_token || "",
                    enabled: globalConfig.enabled,
                    embudo_id: "global",
                })
            }
        }

        // 4. Final fallback: env variables
        return envFallback(embudoId)
    } catch {
        return envFallback(embudoId)
    }
}

/**
 * POST /api/pixel/config
 * Save pixel config for a specific funnel or member.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const body = await req.json()
        const { embudo_id = "global", member_id = "admin", pixel_id, pixel_token, enabled = true } = body

        if (!pixel_id) return NextResponse.json({ error: "pixel_id is required" }, { status: 400 })

        const { data, error } = await supabase
            .from("pixel_configs")
            .upsert(
                {
                    embudo_id,
                    member_id,
                    pixel_id,
                    pixel_token: pixel_token || "",
                    enabled,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "embudo_id,member_id" }
            )
            .select()
            .single()

        if (error) {
            console.error("Pixel POST error:", error.message)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true, data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/**
 * PUT /api/pixel/config
 * List all pixel configs.
 */
export async function PUT(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ configs: [] })

        const { data, error } = await supabase
            .from("pixel_configs")
            .select("*")
            .order("created_at", { ascending: false })

        if (error) {
            console.error("Pixel PUT error:", error.message)
            return NextResponse.json({ configs: [] })
        }

        return NextResponse.json({ configs: data || [] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message, configs: [] })
    }
}
