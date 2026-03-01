import { SubscriptionPlan } from "./subscription-types"

export type FeatureKey =
    | "pipeline"
    | "academy"
    | "community"
    | "integrations"
    | "agendamiento"
    | "builder"
    | "meta_ads"
    | "team_management"
    | "whatsapp_reminders"

export interface TierConfig {
    maxLeads: number
    maxFunnels: number
    features: FeatureKey[]
}

export const TIER_CONFIGS: Record<string, TierConfig> = {
    basico: {
        maxLeads: 100,
        maxFunnels: 1,
        features: ["pipeline", "academy", "community"]
    },
    pro: {
        maxLeads: 500,
        maxFunnels: 3,
        features: ["pipeline", "academy", "community", "integrations", "agendamiento"]
    },
    elite: {
        maxLeads: 10000, // Practically unlimited
        maxFunnels: 10,
        features: ["pipeline", "academy", "community", "integrations", "agendamiento", "builder", "meta_ads", "team_management", "whatsapp_reminders"]
    }
}

/**
 * Check if a plan has access to a specific feature.
 */
export function planHasFeature(planId: string | undefined, feature: FeatureKey): boolean {
    if (!planId) return false
    const config = TIER_CONFIGS[planId]
    if (!config) return false
    return config.features.includes(feature)
}

/**
 * Get the limit for a specific resource.
 */
export function getLimit(planId: string | undefined, resource: "leads" | "funnels"): number {
    if (!planId) return 0
    const config = TIER_CONFIGS[planId]
    if (!config) return 0
    return resource === "leads" ? config.maxLeads : config.maxFunnels
}
