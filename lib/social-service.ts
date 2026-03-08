import { createAdminClient } from "@/lib/supabase/admin"

export interface SocialCenterData {
    username: string
    display_name: string
    tagline?: string
    bio: string
    avatar_url?: string
    theme_config: {
        primary_color: string
        bg_style: string
        button_style?: "glass" | "solid" | "outline"
        layout?: "list" | "grid"
    }
    links: Array<{
        label: string
        url: string
        icon: string
        highlight?: boolean
    }>
    social_links: {
        instagram?: string
        tiktok?: string
        whatsapp?: string
        youtube?: string
        facebook?: string
        linkedin?: string
        twitter?: string
        telegram?: string
    }
    views_count: number
    is_published?: boolean
}

export async function getSocialCenter(username: string): Promise<SocialCenterData | null> {
    const supabase = createAdminClient()
    if (!supabase) return null

    const { data, error } = await supabase
        .from("social_centers")
        .select("*")
        .eq("username", username)
        .maybeSingle()

    if (error || !data) {
        // If not found, try to create a default one if the member exists
        const { data: member } = await supabase
            .from("community_members")
            .select("name, username")
            .eq("username", username)
            .maybeSingle()

        if (member) {
            const defaultData = {
                username: member.username,
                display_name: member.name || username,
                bio: "Bienvenidos a mi ecosistema digital 🚀",
                theme_config: { primary_color: "#8b5cf6", bg_style: "glass_mesh", button_style: "glass" },
                links: [
                    { label: "Franquicia Reset", url: `/r/${member.username}/franquicia-reset`, icon: "rocket", highlight: true }
                ],
                social_links: {}
            }

            await supabase.from("social_centers").insert(defaultData)
            return { ...defaultData, views_count: 0 } as any
        }
        return null
    }

    return data as SocialCenterData
}

export async function incrementSocialViews(username: string) {
    const supabase = createAdminClient()
    if (!supabase) return

    await supabase.rpc('increment_social_views', { x_username: username })
}
