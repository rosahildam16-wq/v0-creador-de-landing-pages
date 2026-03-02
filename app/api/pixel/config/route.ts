import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/pixel/config
 * Returns the pixel configuration for a given funnel or global
 */
export async function GET(req: NextRequest) {
    const embudoId = req.nextUrl.searchParams.get("embudo_id") || "global"

    try {
        const supabase = createAdminClient()
        if (!supabase) {
            // Fallback: check env variables
            return NextResponse.json({
                pixel_id: process.env.META_PIXEL_ID || "",
                enabled: !!process.env.META_PIXEL_ID,
            })
        }

        const { data, error } = await supabase
            .from("pixel_config")
            .select("*")
            .eq("embudo_id", embudoId)
            .maybeSingle()

        if (error && error.code !== "42P01") throw error

        // If no specific config, try global
        if (!data && embudoId !== "global") {
            const { data: globalData } = await supabase
                .from("pixel_config")
                .select("*")
                .eq("embudo_id", "global")
                .maybeSingle()

            return NextResponse.json({
                pixel_id: globalData?.pixel_id || process.env.META_PIXEL_ID || "",
                pixel_token: globalData?.pixel_token || "",
                enabled: globalData?.enabled ?? !!process.env.META_PIXEL_ID,
                embudo_id: "global",
            })
        }

        return NextResponse.json({
            pixel_id: data?.pixel_id || process.env.META_PIXEL_ID || "",
            pixel_token: data?.pixel_token || "",
            enabled: data?.enabled ?? !!process.env.META_PIXEL_ID,
            embudo_id: data?.embudo_id || embudoId,
        })
    } catch (err: any) {
        return NextResponse.json({
            pixel_id: process.env.META_PIXEL_ID || "",
            enabled: !!process.env.META_PIXEL_ID,
        })
    }
}

/**
 * POST /api/pixel/config
 * Save pixel configuration
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const body = await req.json()
        const { embudo_id = "global", pixel_id, pixel_token, enabled = true } = body

        if (!pixel_id) return NextResponse.json({ error: "pixel_id required" }, { status: 400 })

        // Upsert the config
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
            // Table might not exist, try to create it
            if (error.code === "42P01") {
                return NextResponse.json({
                    error: "Table pixel_config not found. Run the SQL migration.",
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
