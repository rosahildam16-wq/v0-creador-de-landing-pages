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

    // Basic fields to fetch
    const fields = "impressions,clicks,spend,reach,frequency,cpc,cpm,cpp,ctr"

    // Format adAccountId (ensure it has act_ prefix if missing for API call)
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
 * Helper: Direct REST call to Supabase to bypass PostgREST schema cache issues.
 * This is used as a fallback so that meta_ads_config always works, even if
 * PostgREST hasn't refreshed its schema cache since the table was created.
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
        // Return error details instead of just null
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

    // Strategy 1: Direct REST API call (most reliable, bypasses PostgREST schema cache)
    const restResult = await directSupabaseRest("POST", "meta_ads_config?on_conflict=member_id", payload)

    if (restResult && !(restResult as any).error) {
        return // Success via direct REST
    }

    const restErrMsg = (restResult as any)?.message || ""
    console.warn("Direct REST upsert failed:", restErrMsg)

    // If table doesn't exist, try creating it first
    if (restErrMsg.includes("relation") || restErrMsg.includes("does not exist") || restErrMsg.includes("404") || restErrMsg.includes("PGRST")) {
        // Strategy 2: Try via Supabase client (may work if schema is cached)
        const supabase = createAdminClient()
        if (supabase) {
            try {
                const { error } = await supabase
                    .from("meta_ads_config")
                    .upsert(payload, { onConflict: 'member_id' })

                if (!error) return // Success
                console.warn("Supabase client upsert also failed:", error.message)

                // Check if the table simply doesn't exist
                if (error.message.includes("relation") || error.code === "42P01") {
                    throw new Error(
                        "La tabla meta_ads_config no existe. Ejecuta el script SQL 015_create_meta_ads_config.sql en tu panel de Supabase (SQL Editor) y luego ejecuta: NOTIFY pgrst, 'reload schema';"
                    )
                }
                throw new Error(`Error al guardar: ${error.message}`)
            } catch (e: any) {
                if (e.message.includes("tabla meta_ads_config")) throw e
                console.warn("Supabase client exception:", e)
            }
        }

        throw new Error(
            "La tabla meta_ads_config no existe en la base de datos. Ve a Supabase SQL Editor y ejecuta el script de creación de tabla."
        )
    }

    // Generic error
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

            if (error) {
                console.warn("Supabase client select failed, falling back to direct REST:", error.message)
            }
        } catch (e) {
            console.warn("Supabase client exception, falling back to direct REST:", e)
        }
    }

    // Fallback: Direct REST API call
    try {
        const result = await directSupabaseRest("GET", `meta_ads_config?member_id=eq.${encodeURIComponent(memberId)}&limit=1`)
        if (result && result.length > 0) {
            const data = result[0]
            return {
                adAccountId: data.ad_account_id,
                accessToken: data.access_token,
                pixelId: data.pixel_id,
                pixelToken: data.pixel_token
            }
        }
    } catch (e) {
        console.warn("Direct REST fallback also failed:", e)
    }

    return null
}
