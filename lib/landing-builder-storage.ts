import type { LandingConfig, LandingTheme, BlockType } from "./landing-builder-types"
import { getDefaultProps } from "./landing-block-defaults"

const STORAGE_KEY = "magic-funnel-landings"

function generateId(): string {
  return `landing_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function generateBlockId(): string {
  return `block_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export const DEFAULT_THEME: LandingTheme = {
  primaryColor: "#7c3aed",
  backgroundColor: "#0f0a1a",
  textColor: "#f8f5ff",
  accentColor: "#a855f7",
  fontFamily: "sans",
  borderRadius: "lg",
}

export function getLandings(): LandingConfig[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

export function getLanding(id: string): LandingConfig | null {
  const landings = getLandings()
  return landings.find((l) => l.id === id) ?? null
}

export function saveLanding(config: LandingConfig): void {
  const landings = getLandings()
  const index = landings.findIndex((l) => l.id === config.id)
  config.updatedAt = new Date().toISOString()
  if (index >= 0) {
    landings[index] = config
  } else {
    landings.push(config)
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(landings))
}

export function deleteLanding(id: string): void {
  const landings = getLandings().filter((l) => l.id !== id)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(landings))
}

export function duplicateLanding(id: string): LandingConfig | null {
  const landing = getLanding(id)
  if (!landing) return null
  const newLanding: LandingConfig = {
    ...landing,
    id: generateId(),
    name: `${landing.name} (copia)`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "draft",
    blocks: landing.blocks.map((b) => ({ ...b, id: generateBlockId() })),
  }
  saveLanding(newLanding)
  return newLanding
}

export function createLanding(name: string, description: string, blockTypes: BlockType[]): LandingConfig {
  const config: LandingConfig = {
    id: generateId(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    theme: { ...DEFAULT_THEME },
    status: "draft",
    blocks: blockTypes.map((type, i) => ({
      id: generateBlockId(),
      type,
      props: getDefaultProps(type),
      order: i,
    })),
  }
  saveLanding(config)
  return config
}
