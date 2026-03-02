import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/pixel/config?embudo_id=franquicia-reset
 * Returns pixel config for a specific funnel, with global fallback.
 * Like Hotmart: each product/funnel can have its own pixel.
 */
export async function GET(req: NextRequest) {
    const embudoId = req.nextUrl.searchParams.get("embudo_id") || "global"

    try {
        const supabase = createAdminClient()
        if (!supabase) {
            return NextResponse.json({
                pixel_id: process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
                enabled: !!(process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID),
                embudo_id: embudoId,
            })
        }

        // Try specific embudo first
        const { data, error } = await supabase
            .from("pixel_config")
            .select("*")
            .eq("embudo_id", embudoId)
            .maybeSingle()

        if (error && error.code === "42P01") {
            // Table doesn't exist, use env fallback
            return NextResponse.json({
                pixel_id: process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
                enabled: !!(process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID),
                embudo_id: embudoId,
            })
        }

        if (data && data.enabled) {
            return NextResponse.json({
                pixel_id: data.pixel_id,
                pixel_token: data.pixel_token || "",
                enabled: data.enabled,
                embudo_id: data.embudo_id,
            })
        }

        // Fallback to global config
        if (embudoId !== "global") {
            const { data: globalData } = await supabase
                .from("pixel_config")
                .select("*")
                .eq("embudo_id", "global")
                .maybeSingle()

            if (globalData && globalData.enabled) {
                return NextResponse.json({
                    pixel_id: globalData.pixel_id,
                    pixel_token: globalData.pixel_token || "",
                    enabled: globalData.enabled,
                    embudo_id: "global",
                })
            }
        }

        // Final fallback: env variables
        return NextResponse.json({
            pixel_id: process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
            enabled: !!(process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID),
            embudo_id: embudoId,
        })
    } catch {
        return NextResponse.json({
            pixel_id: process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
            enabled: !!(process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID),
        })
    }
}

/**
 * POST /api/pixel/config
 * Save pixel config for a specific funnel or global.
 * Body: { embudo_id, pixel_id, pixel_token?, enabled? }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const body = await req.json()
        const { embudo_id = "global", pixel_id, pixel_token, enabled = true } = body

        if (!pixel_id) return NextResponse.json({ error: "pixel_id is required" }, { status: 400 })

        const { data, error } = await supabase
            .from("pixel_config")
            .upsert(
                {
                    embudo_id,
                    pixel_id,
                    pixel_token: pixel_token || "",
                    enabled,
                    updated_at: new Date().toISOString(),
                },
                { onConflict: "embudo_id" }
            )
            .select()
            .single()

        if (error) {
            if (error.code === "42P01") {
                return NextResponse.json({
                    error: "Table pixel_config not found",
                    sql: `CREATE TABLE IF NOT EXISTS pixel_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embudo_id TEXT NOT NULL UNIQUE DEFAULT 'global',
  pixel_id TEXT NOT NULL DEFAULT '',
  pixel_token TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE pixel_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_pixel" ON pixel_config FOR ALL USING (true) WITH CHECK (true);`
                }, { status: 500 })
            }
            throw error
        }

        return NextResponse.json({ success: true, data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

/**
 * GET /api/pixel/config?all=true
 * List all pixel configs (for admin)
 */
export async function PUT(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ configs: [] })

        const { data, error } = await supabase
            .from("pixel_config")
            .select("*")
            .order("created_at", { ascending: false })

        if (error && error.code === "42P01") return NextResponse.json({ configs: [] })
        if (error) throw error

        return NextResponse.json({ configs: data || [] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message, configs: [] })
    }
}
