import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * POST /api/meta-ads/setup
 * Creates the meta_ads_config table if it doesn't exist.
 * Called automatically before first save attempt.
 */
export async function POST() {
    try {
        const supabase = createAdminClient()
        if (!supabase) {
            return NextResponse.json({ error: "No database configured" }, { status: 500 })
        }

        // Check if table exists by trying to query it
        const { error: checkError } = await supabase
            .from("meta_ads_config")
            .select("id")
            .limit(1)

        if (!checkError) {
            return NextResponse.json({ success: true, message: "Table already exists" })
        }

        // Table doesn't exist - create it via raw SQL
        const url = process.env.NEXT_PUBLIC_SUPABASE_URL
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY

        if (!url || !key) {
            return NextResponse.json({
                error: "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to your environment variables."
            }, { status: 500 })
        }

        // Use Supabase's SQL execution endpoint
        const createSQL = `
            CREATE TABLE IF NOT EXISTS public.meta_ads_config (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                member_id TEXT NOT NULL UNIQUE,
                ad_account_id TEXT NOT NULL DEFAULT '',
                access_token TEXT NOT NULL DEFAULT '',
                pixel_id TEXT DEFAULT '',
                pixel_token TEXT DEFAULT '',
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now()
            );
            ALTER TABLE public.meta_ads_config ENABLE ROW LEVEL SECURITY;
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meta_ads_config') THEN
                    CREATE POLICY "allow_all_meta_ads_config" ON public.meta_ads_config FOR ALL USING (true) WITH CHECK (true);
                END IF;
            END $$;
            NOTIFY pgrst, 'reload schema';
        `

        // Try multiple methods to execute SQL
        // Method 1: rpc endpoint (Supabase edge function)
        let success = false

        // Method 2: Direct PostgreSQL query via SQL API
        const sqlRes = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
            method: "POST",
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ sql: createSQL })
        })

        if (sqlRes.ok) {
            success = true
        } else {
            // Method 3: Use the Supabase Management API
            // Get project ref from URL
            const projectRef = url.match(/https:\/\/([^.]+)\./)?.[1]

            if (projectRef) {
                const mgmtRes = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${key}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ query: createSQL })
                })

                if (mgmtRes.ok) {
                    success = true
                }
            }
        }

        if (success) {
            // Wait for PostgREST to refresh schema
            await new Promise(resolve => setTimeout(resolve, 2000))
            return NextResponse.json({ success: true, message: "Table created successfully" })
        }

        // If nothing works, return the SQL for manual execution
        return NextResponse.json({
            error: "auto_create_failed",
            message: "No se pudo crear automáticamente. Debes ejecutar el SQL manualmente.",
            sql: createSQL.trim()
        }, { status: 422 })

    } catch (err: any) {
        console.error("Meta Ads setup error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
