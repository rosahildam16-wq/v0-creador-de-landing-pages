// Server-side store for integration tokens.
// GHL config persists to Supabase (ghl_config table) when available.
// Google, Zoom, WhatsApp remain in-memory.

export interface GoogleTokens {
  access_token: string
  refresh_token?: string
  expiry_date?: number
  email?: string
}

export interface ZoomTokens {
  access_token: string
  refresh_token?: string
  expiry_date?: number
  email?: string
}

export interface WhatsAppSession {
  connected: boolean
  phone?: string
  qr?: string
  lastSeen?: number
}

export interface GHLConfig {
  webhookUrl: string
  apiKey?: string
  locationId?: string
  baseUrl?: string        // default: https://services.leadconnectorhq.com
  apiVersion?: string     // default: 2021-07-28
  defaultSource?: string  // default: magic-funnel
  timeoutMs?: number      // default: 10000
  retryCount?: number     // default: 2
}

interface IntegrationStore {
  google: GoogleTokens | null
  zoom: ZoomTokens | null
  whatsapp: WhatsAppSession | null
  ghl: GHLConfig | null
  ghlLoaded: boolean // whether the in-memory cache was hydrated from DB
}

// Global in-memory store (persists across hot reloads in dev)
const globalStore = globalThis as unknown as { __integrationStore?: IntegrationStore }

if (!globalStore.__integrationStore) {
  globalStore.__integrationStore = {
    google: null,
    zoom: null,
    whatsapp: null,
    ghl: null,
    ghlLoaded: false,
  }
}

export const store = globalStore.__integrationStore

// --------------- helpers ---------------

function hasSupabase(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  )
}

async function getSupabase() {
  const { createAdminClient } = await import("@/lib/supabase/admin")
  return createAdminClient()
}

// --------------- Google ---------------

export function getGoogleTokens(): GoogleTokens | null {
  return store.google
}

export function setGoogleTokens(tokens: GoogleTokens) {
  store.google = tokens
}

export function clearGoogleTokens() {
  store.google = null
}

// --------------- Zoom ---------------

export function getZoomTokens(): ZoomTokens | null {
  return store.zoom
}

export function setZoomTokens(tokens: ZoomTokens) {
  store.zoom = tokens
}

export function clearZoomTokens() {
  store.zoom = null
}

// --------------- WhatsApp ---------------

export function getWhatsAppSession(): WhatsAppSession | null {
  return store.whatsapp
}

export function setWhatsAppSession(session: WhatsAppSession) {
  store.whatsapp = session
}

export function clearWhatsAppSession() {
  store.whatsapp = null
}

// --------------- GHL Config (hybrid: DB + in-memory cache) ---------------

/**
 * Read GHL config from the in-memory cache (synchronous).
 * Call `loadGHLConfigFromDB()` first in API routes to hydrate the cache.
 */
export function getGHLConfig(): GHLConfig | null {
  return store.ghl
}

/**
 * Save GHL config to Supabase (if available) and update in-memory cache.
 */
export async function setGHLConfig(config: GHLConfig): Promise<void> {
  // Always update the in-memory cache
  store.ghl = config
  store.ghlLoaded = true

  if (hasSupabase()) {
    try {
      const supabase = await getSupabase()
      await supabase.from("ghl_config").upsert({
        id: "default",
        webhook_url: config.webhookUrl ?? "",
        api_key: config.apiKey ?? "",
        location_id: config.locationId ?? "",
        base_url: config.baseUrl ?? "https://services.leadconnectorhq.com",
        api_version: config.apiVersion ?? "2021-07-28",
        default_source: config.defaultSource ?? "magic-funnel",
        timeout_ms: config.timeoutMs ?? 10000,
        retry_count: config.retryCount ?? 2,
        updated_at: new Date().toISOString(),
      })
    } catch {
      // DB write failed — config is still in memory
    }
  }
}

/**
 * Hydrate the in-memory GHL config cache from Supabase.
 * Call this at the start of API routes that use GHL.
 * No-op if already loaded or Supabase is not available.
 */
export async function loadGHLConfigFromDB(): Promise<void> {
  // Skip if already loaded this server lifecycle or no Supabase
  if (store.ghlLoaded || !hasSupabase()) return

  try {
    const supabase = await getSupabase()
    const { data, error } = await supabase
      .from("ghl_config")
      .select("*")
      .eq("id", "default")
      .single()

    if (error || !data) {
      store.ghlLoaded = true
      return
    }

    const row = data as Record<string, unknown>

    // Only set if there's meaningful config (at least a webhook_url or api_key)
    const webhookUrl = (row.webhook_url as string) ?? ""
    const apiKey = (row.api_key as string) ?? ""

    if (webhookUrl || apiKey) {
      store.ghl = {
        webhookUrl,
        apiKey,
        locationId: (row.location_id as string) ?? "",
        baseUrl: (row.base_url as string) ?? "https://services.leadconnectorhq.com",
        apiVersion: (row.api_version as string) ?? "2021-07-28",
        defaultSource: (row.default_source as string) ?? "magic-funnel",
        timeoutMs: (row.timeout_ms as number) ?? 10000,
        retryCount: (row.retry_count as number) ?? 2,
      }
    }

    store.ghlLoaded = true
  } catch {
    store.ghlLoaded = true
  }
}

/**
 * Clear GHL config from DB and memory.
 */
export async function clearGHLConfig(): Promise<void> {
  store.ghl = null
  store.ghlLoaded = false

  if (hasSupabase()) {
    try {
      const supabase = await getSupabase()
      await supabase.from("ghl_config").update({
        webhook_url: "",
        api_key: "",
        location_id: "",
        updated_at: new Date().toISOString(),
      }).eq("id", "default")
    } catch {
      // Fallback — already cleared in memory
    }
  }
}
