import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

const CREATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS pixel_config (
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
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='pixel_config' AND policyname='allow_all_pixel') THEN
    CREATE POLICY "allow_all_pixel" ON pixel_config FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
GRANT ALL ON pixel_config TO anon, authenticated, service_role;
`

/** Auto-create table if missing */
async function ensureTable(supabase: any): Promise<void> {
    try {
        await supabase.rpc("exec_sql", { query: CREATE_TABLE_SQL })
    } catch {
        // rpc may not exist — try a raw query via the REST fallback
        try {
            // Use supabase-js .from() to probe the table
            const { error } = await supabase.from("pixel_config").select("id").limit(1)
            if (error && (error.code === "42P01" || error.message?.includes("schema cache"))) {
                // Table definitely missing — try creating via sql endpoint
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
                const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
                if (supabaseUrl && serviceKey) {
                    await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            apikey: serviceKey,
                            Authorization: `Bearer ${serviceKey}`,
                        },
                        body: JSON.stringify({ query: CREATE_TABLE_SQL }),
                    }).catch(() => { })
                }
            }
        } catch { /* noop */ }
    }
}

/** Check if error is a "table not found" or "schema cache" error */
function isTableMissing(error: any): boolean {
    if (!error) return false
    return error.code === "42P01" ||
        error.message?.includes("schema cache") ||
        error.message?.includes("pixel_config")
}

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
 * Returns pixel config for a specific funnel and member, with global fallback.
 */
export async function GET(req: NextRequest) {
    const embudoId = req.nextUrl.searchParams.get("embudo_id") || "global"
    const memberId = req.nextUrl.searchParams.get("member_id") || "admin"

    try {
        const supabase = createAdminClient()
        if (!supabase) return envFallback(embudoId)

        // 1. Try specific member + embudo config
        let { data: memberData, error } = await supabase
            .from("pixel_config")
            .select("*")
            .eq("embudo_id", embudoId)
            .eq("member_id", memberId)
            .maybeSingle()

        // If table missing, try to create it and retry once
        if (isTableMissing(error)) {
            await ensureTable(supabase)
            // After creating, return env fallback (table is empty)
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
        return envFallback(embudoId)
    } catch {
        return envFallback(embudoId)
    }
}

/**
 * POST /api/pixel/config
 * Save pixel config for a specific funnel or member.
 * Auto-creates the table if it doesn't exist.
 */
export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const body = await req.json()
        const { embudo_id = "global", member_id = "admin", pixel_id, pixel_token, enabled = true } = body

        if (!pixel_id) return NextResponse.json({ error: "pixel_id is required" }, { status: 400 })

        const upsertPayload = {
            embudo_id,
            member_id,
            pixel_id,
            pixel_token: pixel_token || "",
            enabled,
            updated_at: new Date().toISOString(),
        }

        // First attempt
        let { data, error } = await supabase
            .from("pixel_config")
            .upsert(upsertPayload, { onConflict: "embudo_id,member_id" })
            .select()
            .single()

        // If table missing, create it and retry
        if (isTableMissing(error)) {
            await ensureTable(supabase)

            // Retry after table creation
            const retry = await supabase
                .from("pixel_config")
                .upsert(upsertPayload, { onConflict: "embudo_id,member_id" })
                .select()
                .single()

            data = retry.data
            error = retry.error

            // If still failing, try raw SQL insert as last resort
            if (error) {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ""
                const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ""
                if (supabaseUrl && serviceKey) {
                    const insertSQL = `
                        INSERT INTO pixel_config (embudo_id, member_id, pixel_id, pixel_token, enabled)
                        VALUES ('${embudo_id}', '${member_id}', '${pixel_id}', '${(pixel_token || "").replace(/'/g, "''")}', ${enabled})
                        ON CONFLICT (embudo_id, member_id) DO UPDATE SET
                            pixel_id = EXCLUDED.pixel_id,
                            pixel_token = EXCLUDED.pixel_token,
                            enabled = EXCLUDED.enabled,
                            updated_at = now()
                        RETURNING *;
                    `
                    try {
                        const rawRes = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                                apikey: serviceKey,
                                Authorization: `Bearer ${serviceKey}`,
                            },
                            body: JSON.stringify({ query: insertSQL }),
                        })
                        if (rawRes.ok) {
                            return NextResponse.json({ success: true, data: upsertPayload })
                        }
                    } catch { /* noop */ }
                }

                return NextResponse.json({ error: error.message }, { status: 500 })
            }
        }

        if (error) throw error

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

        if (isTableMissing(error)) {
            await ensureTable(supabase)
            return NextResponse.json({ configs: [] })
        }
        if (error) throw error

        return NextResponse.json({ configs: data || [] })
    } catch (err: any) {
        return NextResponse.json({ error: err.message, configs: [] })
    }
}
