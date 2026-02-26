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
 * Save Meta ads config to DB (member-specific)
 */
export async function saveMetaAdsConfig(memberId: string, config: MetaAdsConfig) {
    const supabase = createAdminClient()
    if (!supabase) throw new Error("Connection failed")

    const { error } = await supabase.from("meta_ads_config").upsert({
        member_id: memberId,
        ad_account_id: config.adAccountId,
        access_token: config.accessToken,
        pixel_id: config.pixelId || "",
        pixel_token: config.pixelToken || "",
        updated_at: new Date().toISOString()
    })

    if (error) throw error
}

/**
 * Load Meta ads config from DB
 */
export async function loadMetaAdsConfig(memberId: string): Promise<MetaAdsConfig | null> {
    const supabase = createAdminClient()
    if (!supabase) return null

    try {
        const { data, error } = await supabase
            .from("meta_ads_config")
            .select("*")
            .eq("member_id", memberId)
            .maybeSingle()

        if (error) {
            if (error.code === '42P01') return null // Table doesn't exist
            return null
        }

        if (!data) return null

        return {
            adAccountId: data.ad_account_id,
            accessToken: data.access_token,
            pixelId: data.pixel_id,
            pixelToken: data.pixel_token
        }
    } catch {
        return null
    }
}
