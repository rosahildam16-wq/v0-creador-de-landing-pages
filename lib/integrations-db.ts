import { createAdminClient } from "./supabase/admin"

export interface IntegrationTokens {
    access_token: string
    refresh_token?: string
    expiry_date?: number
    email?: string
    phone?: string
    settings?: any
}

/**
 * Save integration tokens to Supabase.
 */
export async function saveIntegration(memberId: string, provider: string, tokens: IntegrationTokens) {
    const supabase = createAdminClient()
    if (!supabase) return null

    const { data, error } = await supabase
        .from("member_integrations")
        .upsert({
            member_id: memberId,
            provider,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expiry_date: tokens.expiry_date,
            email: tokens.email,
            phone: tokens.phone,
            settings: tokens.settings || {},
            updated_at: new Date().toISOString(),
        }, {
            onConflict: "member_id,provider"
        })
        .select()
        .single()

    if (error) {
        console.error(`Error saving ${provider} integration:`, error)
        return null
    }
    return data
}

/**
 * Get integration tokens from Supabase.
 */
export async function getIntegration(memberId: string, provider: string) {
    const supabase = createAdminClient()
    if (!supabase) return null

    const { data, error } = await supabase
        .from("member_integrations")
        .select("*")
        .eq("member_id", memberId)
        .eq("provider", provider)
        .single()

    if (error) return null
    return data
}

/**
 * Delete an integration.
 */
export async function deleteIntegration(memberId: string, provider: string) {
    const supabase = createAdminClient()
    if (!supabase) return false

    const { error } = await supabase
        .from("member_integrations")
        .delete()
        .eq("member_id", memberId)
        .eq("provider", provider)

    return !error
}
