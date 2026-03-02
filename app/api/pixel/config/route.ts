import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/pixel/config?embudo_id=franquicia-reset&member_id=username
 * Returns pixel config for a specific funnel and member, with global fallback.
 * Like Hotmart: each product/funnel/member can have its own pixel.
 */
export async function GET(req: NextRequest) {
    const embudoId = req.nextUrl.searchParams.get("embudo_id") || "global"
    const memberId = req.nextUrl.searchParams.get("member_id") || "admin"

    try {
        const supabase = createAdminClient()
        if (!supabase) {
            return NextResponse.json({
                pixel_id: process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
                enabled: !!(process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID),
                embudo_id: embudoId,
            })
        }

        // 1. Try specific member + embudo config
        const { data: memberData, error } = await supabase
            .from("pixel_config")
            .select("*")
            .eq("embudo_id", embudoId)
            .eq("member_id", memberId)
            .maybeSingle()

        if (error && error.code === "42P01") {
            // Table doesn't exist, use env fallback
            return NextResponse.json({
                pixel_id: process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID || "",
                enabled: !!(process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID),
                embudo_id: embudoId,
            })
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

        // 2. Fallback to global embudo config (admin's pixel for this funnel)
        if (memberId !== "admin") {
            const { data: adminConfig } = await supabase
                .from("pixel_config")
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
            const { data: globalAppConfig } = await supabase
                .from("pixel_config")
                .select("*")
                .eq("embudo_id", "global")
                .eq("member_id", "admin")
                .maybeSingle()

            if (globalAppConfig && globalAppConfig.enabled) {
                return NextResponse.json({
                    pixel_id: globalAppConfig.pixel_id,
                    pixel_token: globalAppConfig.pixel_token || "",
                    enabled: globalAppConfig.enabled,
                    embudo_id: "global",
                })
            }
        }

        // 4. Final fallback: env variables
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
 * Save pixel config for a specific funnel or member.
 * Body: { embudo_id, member_id?, pixel_id, pixel_token?, enabled? }
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const body = await req.json()
        const { embudo_id = "global", member_id = "admin", pixel_id, pixel_token, enabled = true } = body

        if (!pixel_id) return NextResponse.json({ error: "pixel_id is required" }, { status: 400 })

        const { data, error } = await supabase
            .from("pixel_config")
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
            if (error.code === "42P01") {
                return NextResponse.json({
                    error: "Table pixel_config not found",
                    sql: `CREATE TABLE IF NOT EXISTS pixel_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embudo_id TEXT NOT NULL DEFAULT 'global',
  member_id TEXT NOT NULL DEFAULT 'admin',
  pixel_id TEXT NOT NULL DEFAULT '',
  pixel_token TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(embudo_id, member_id)
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
 * PUT /api/pixel/config
 * List all pixel configs
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

