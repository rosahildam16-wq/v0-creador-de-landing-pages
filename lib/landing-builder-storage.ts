/**
 * Landing Builder Storage — Database-backed via /api/funnels
 *
 * All data persists in Supabase `funnels` table.
 * No localStorage — works across devices and sessions.
 */
import type { LandingConfig, LandingTheme, BlockType } from "./landing-builder-types"
import { getDefaultProps } from "./landing-block-defaults"

export function generateBlockId(): string {
    return `block_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function generateId(): string {
    return `landing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export const DEFAULT_THEME: LandingTheme = {
    primaryColor: "#7c3aed",
    backgroundColor: "#0f0a1a",
    textColor: "#f8f5ff",
    accentColor: "#a855f7",
    fontFamily: "sans",
    borderRadius: "lg",
}

// ─── DB helpers ──────────────────────────────────────────────────────────────

function rowToConfig(row: any): LandingConfig {
    const cfg = row.config || {}
    return {
        id: row.id,
        name: row.name,
        description: row.description || "",
        slug: row.slug,
        customDomain: row.custom_domain || "",
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        theme: cfg.theme || { ...DEFAULT_THEME },
        blocks: cfg.blocks || [],
    }
}

function configToPayload(config: LandingConfig) {
    return {
        id: config.id,
        name: config.name,
        description: config.description || "",
        slug: config.slug,
        status: config.status,
        custom_domain: config.customDomain || null,
        config: {
            theme: config.theme,
            blocks: config.blocks,
        },
    }
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function getLandings(): Promise<LandingConfig[]> {
    const res = await fetch("/api/funnels", { cache: "no-store" })
    if (!res.ok) return []
    const data = await res.json()
    return (data.funnels || []).map(rowToConfig)
}

export async function getLanding(id: string): Promise<LandingConfig | null> {
    const res = await fetch(`/api/funnels/${id}`, { cache: "no-store" })
    if (!res.ok) return null
    const data = await res.json()
    return data.funnel ? rowToConfig(data.funnel) : null
}

export async function saveLanding(config: LandingConfig): Promise<void> {
    const existsRes = await fetch(`/api/funnels/${config.id}`, { cache: "no-store" })
    const exists = existsRes.ok && (await existsRes.json()).funnel

    const payload = configToPayload(config)

    if (exists) {
        await fetch(`/api/funnels/${config.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
    } else {
        await fetch("/api/funnels", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
        })
    }
}

export async function deleteLanding(id: string): Promise<void> {
    await fetch(`/api/funnels/${id}`, { method: "DELETE" })
}

export async function duplicateLanding(id: string): Promise<LandingConfig | null> {
    const landing = await getLanding(id)
    if (!landing) return null

    const newLanding: LandingConfig = {
        ...landing,
        id: generateId(),
        name: `${landing.name} (copia)`,
        slug: `${landing.slug}-copia-${Date.now().toString(36)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: "draft",
        blocks: landing.blocks.map(b => ({ ...b, id: generateBlockId() })),
    }

    await saveLanding(newLanding)
    return newLanding
}

export async function createLanding(
    name: string,
    description: string,
    blockTypes: BlockType[]
): Promise<LandingConfig> {
    const config: LandingConfig = {
        id: generateId(),
        name,
        description,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        theme: { ...DEFAULT_THEME },
        status: "draft",
        slug: name
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
        customDomain: "",
        blocks: blockTypes.map((type, i) => ({
            id: generateBlockId(),
            type,
            props: getDefaultProps(type),
            order: i,
        })),
    }

    await saveLanding(config)
    return config
}
