import { createAdminClient } from "@/lib/supabase/admin"

export interface MetaAdsConfig {
    adAccountId: string
    accessToken: string
    pixelId?: string
    pixelToken?: string
}

const META_API_VERSION = "v19.0"
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

/**
 * Fetch insights from Meta Marketing API
 */
export async function getMetaInsights(config: MetaAdsConfig, datePreset: string = "last_30d") {
    const { adAccountId, accessToken } = config

    const fields = "impressions,clicks,spend,reach,frequency,cpc,cpm,cpp,ctr"
    const fullAdAccountId = adAccountId.startsWith("act_") ? adAccountId : `act_${adAccountId}`
    const endpoint = `${BASE_URL}/${fullAdAccountId}/insights?fields=${fields}&date_preset=${datePreset}&access_token=${accessToken}`

    try {
        const response = await fetch(endpoint)
        const data = await response.json()

        if (data.error) {
            console.error("Meta API error:", data.error)
            throw new Error(data.error.message || "Meta API Error")
        }

        return data.data || []
    } catch (error) {
        console.error("Meta API fetch error:", error)
        throw error
    }
}

/**
 * Auto-create the meta_ads_config table via Supabase SQL RPC
 */
async function ensureMetaAdsTable(): Promise<boolean> {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) return false

    const sql = `
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
            IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meta_ads_config' AND policyname = 'allow_all_meta_ads_config') THEN
                CREATE POLICY "allow_all_meta_ads_config" ON public.meta_ads_config FOR ALL USING (true) WITH CHECK (true);
            END IF;
        END $$;
        NOTIFY pgrst, 'reload schema';
    `

    try {
        // Use the Supabase SQL endpoint directly
        const res = await fetch(`${url}/rest/v1/rpc/`, {
            method: "POST",
            headers: {
                "apikey": key,
                "Authorization": `Bearer ${key}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ query: sql })
        })

        // If RPC doesn't work, try the pg endpoint
        if (!res.ok) {
            // Alternative: use the /pg endpoint if available, or just use supabase client
            const supabase = createAdminClient()
            if (!supabase) return false

            // Try to create via Supabase Management API or just execute raw SQL
            // The simplest approach: try to query the table - if it fails, we know it doesn't exist
            const { error } = await supabase.from("meta_ads_config").select("id").limit(1)

            if (error && (error.message.includes("relation") || error.code === "42P01")) {
                console.log("Table meta_ads_config does not exist, attempting to create via direct SQL...")

                // Use the Supabase SQL API (Management API)
                const sqlRes = await fetch(`${url}/pg/query`, {
                    method: "POST",
                    headers: {
                        "apikey": key,
                        "Authorization": `Bearer ${key}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ query: sql })
                })

                if (sqlRes.ok) {
                    console.log("Table meta_ads_config created successfully!")
                    // Wait a moment for PostgREST to refresh
                    await new Promise(resolve => setTimeout(resolve, 2000))
                    return true
                }

                // If that also doesn't work, return false
                console.warn("Could not auto-create table. Status:", sqlRes.status)
                return false
            }

            // Table exists
            return true
        }

        return true
    } catch (err) {
        console.warn("Error ensuring meta_ads_config table:", err)
        return false
    }
}

/**
 * Direct REST call to Supabase (bypasses PostgREST schema cache)
 */
async function directSupabaseRest(method: string, path: string, body?: any) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) return null

    const headers: Record<string, string> = {
        "apikey": key,
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json",
        "Prefer": method === "POST" ? "resolution=merge-duplicates,return=representation" : "return=representation",
    }

    const res = await fetch(`${url}/rest/v1/${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
        const errText = await res.text()
        console.error(`Direct Supabase REST error (${res.status}):`, errText)
        return { error: true, status: res.status, message: errText }
    }

    const text = await res.text()
    if (!text) return []
    try {
        return JSON.parse(text)
    } catch (e) {
        return []
    }
}

/**
 * Save Meta ads config to DB (member-specific)
 * Auto-creates the table if it doesn't exist.
 */
export async function saveMetaAdsConfig(memberId: string, config: MetaAdsConfig) {
    const payload = {
        member_id: memberId,
        ad_account_id: config.adAccountId,
        access_token: config.accessToken,
        pixel_id: config.pixelId || "",
        pixel_token: config.pixelToken || "",
        updated_at: new Date().toISOString()
    }

    // Strategy 1: Try direct REST (fastest, bypasses schema cache)
    let restResult = await directSupabaseRest("POST", "meta_ads_config?on_conflict=member_id", payload)

    if (restResult && !(restResult as any).error) {
        return // Success!
    }

    const restErrMsg = (restResult as any)?.message || ""
    console.warn("Direct REST upsert failed:", restErrMsg)

    // If table doesn't exist, try to auto-create it
    if (restErrMsg.includes("relation") || restErrMsg.includes("does not exist") || restErrMsg.includes("PGRST")) {
        console.log("Attempting to auto-create meta_ads_config table...")
        const created = await ensureMetaAdsTable()

        if (created) {
            // Retry the save after creating the table
            await new Promise(resolve => setTimeout(resolve, 1500))

            // Try Supabase client first (should work now)
            const supabase = createAdminClient()
            if (supabase) {
                const { error } = await supabase
                    .from("meta_ads_config")
                    .upsert(payload, { onConflict: 'member_id' })

                if (!error) return // Success!
                console.warn("Post-creation save failed:", error.message)
            }

            // Try direct REST again
            restResult = await directSupabaseRest("POST", "meta_ads_config?on_conflict=member_id", payload)
            if (restResult && !(restResult as any).error) {
                return // Success!
            }
        }

        // If auto-create failed, give clear instructions
        throw new Error(
            "No se pudo crear la tabla automáticamente. Ve a Supabase → SQL Editor y ejecuta:\n\n" +
            "CREATE TABLE IF NOT EXISTS public.meta_ads_config (\n" +
            "  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,\n" +
            "  member_id TEXT NOT NULL UNIQUE,\n" +
            "  ad_account_id TEXT NOT NULL DEFAULT '',\n" +
            "  access_token TEXT NOT NULL DEFAULT '',\n" +
            "  pixel_id TEXT DEFAULT '',\n" +
            "  pixel_token TEXT DEFAULT '',\n" +
            "  created_at TIMESTAMPTZ DEFAULT now(),\n" +
            "  updated_at TIMESTAMPTZ DEFAULT now()\n" +
            ");\n" +
            "ALTER TABLE public.meta_ads_config ENABLE ROW LEVEL SECURITY;\n" +
            "CREATE POLICY \"allow_all\" ON public.meta_ads_config FOR ALL USING (true) WITH CHECK (true);\n" +
            "NOTIFY pgrst, 'reload schema';"
        )
    }

    // Strategy 2: Try Supabase client
    const supabase = createAdminClient()
    if (supabase) {
        const { error } = await supabase
            .from("meta_ads_config")
            .upsert(payload, { onConflict: 'member_id' })

        if (!error) return
        throw new Error(`Error al guardar: ${error.message}`)
    }

    throw new Error(`Error al guardar configuración: ${restErrMsg || "No se pudo conectar con la base de datos"}`)
}

/**
 * Load Meta ads config from DB
 */
export async function loadMetaAdsConfig(memberId: string): Promise<MetaAdsConfig | null> {
    // Try via Supabase client first
    const supabase = createAdminClient()
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from("meta_ads_config")
                .select("*")
                .eq("member_id", memberId)
                .maybeSingle()

            if (!error && data) {
                return {
                    adAccountId: data.ad_account_id,
                    accessToken: data.access_token,
                    pixelId: data.pixel_id,
                    pixelToken: data.pixel_token
                }
            }

            // Table doesn't exist - that's ok, just means not configured yet
            if (error && (error.message.includes("relation") || error.code === "42P01")) {
                return null
            }

            if (error) {
                console.warn("Supabase client select failed:", error.message)
            }
        } catch (e) {
            console.warn("Supabase client exception:", e)
        }
    }

    // Fallback: Direct REST API call
    try {
        const result = await directSupabaseRest("GET", `meta_ads_config?member_id=eq.${encodeURIComponent(memberId)}&limit=1`)
        if (result && !((result as any).error) && result.length > 0) {
            const data = result[0]
            return {
                adAccountId: data.ad_account_id,
                accessToken: data.access_token,
                pixelId: data.pixel_id,
                pixelToken: data.pixel_token
            }
        }
    } catch (e) {
        console.warn("Direct REST fallback failed:", e)
    }

    return null
}
