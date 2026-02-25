/**
 * Centralized GoHighLevel API v2 client.
 * Handles upsert (search + create/update), webhook dispatch, retries with backoff,
 * and structured logging. Never exposes API keys in logs.
 */

import { getGHLConfig } from "@/lib/integrations-store"

// ─── Types ─────────────────────────────────────────────────────────

export interface GHLContactPayload {
  firstName: string
  lastName: string
  email: string
  phone: string
  source: string
  tags: string[]
  locationId?: string
  customFields?: Record<string, string>
}

export interface GHLResult {
  action: "created" | "updated" | "webhook_sent" | "skipped" | "failed"
  status: "success" | "error" | "rejected" | "retrying"
  message: string
  httpCode: number | null
  contactId: string | null
  attempt: number
  maxAttempts: number
  elapsed: string
  payloadSent: Record<string, unknown>
  responseBody: string | null
}

interface GHLResolvedConfig {
  apiKey: string
  locationId: string
  baseUrl: string
  apiVersion: string
  defaultSource: string
  timeoutMs: number
  retryCount: number
}

// ─── Config resolution ─────────────────────────────────────────────

export function resolveGHLConfig(): GHLResolvedConfig | null {
  const stored = getGHLConfig()
  const apiKey = stored?.apiKey || process.env.GHL_API_KEY || ""
  const locationId = stored?.locationId || process.env.GHL_LOCATION_ID || ""

  if (!apiKey || !locationId) return null

  return {
    apiKey,
    locationId,
    baseUrl: stored?.baseUrl || "https://services.leadconnectorhq.com",
    apiVersion: stored?.apiVersion || "2021-07-28",
    defaultSource: stored?.defaultSource || "magic-funnel",
    timeoutMs: stored?.timeoutMs || 10000,
    retryCount: stored?.retryCount || 2,
  }
}

export function resolveWebhookUrl(): string | null {
  const stored = getGHLConfig()
  return stored?.webhookUrl || process.env.GHL_WEBHOOK_URL || null
}

// ─── Core: upsert contact ──────────────────────────────────────────

export async function upsertContact(
  contact: GHLContactPayload,
  overrideConfig?: Partial<GHLResolvedConfig>
): Promise<GHLResult> {
  const startTime = Date.now()
  const cfg = resolveGHLConfig()
  if (!cfg) {
    return makeResult("failed", "error", "Credenciales GHL no configuradas.", null, null, 1, 1, startTime, contact)
  }

  const merged = { ...cfg, ...overrideConfig }
  const maxAttempts = merged.retryCount + 1 // 1 initial + retries

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await attemptUpsert(contact, merged, attempt, maxAttempts, startTime)
      if (result.status === "success" || result.status === "rejected") {
        return result
      }
      // Retryable error
      if (attempt < maxAttempts) {
        await sleep(backoff(attempt))
      } else {
        return result
      }
    } catch (err) {
      if (attempt >= maxAttempts) {
        return makeResult(
          "failed", "error",
          `Error tras ${maxAttempts} intentos: ${err instanceof Error ? err.message : "desconocido"}`,
          null, null, attempt, maxAttempts, startTime, contact
        )
      }
      await sleep(backoff(attempt))
    }
  }

  // Should not reach here
  return makeResult("failed", "error", "Error inesperado en upsert.", null, null, maxAttempts, maxAttempts, startTime, contact)
}

async function attemptUpsert(
  contact: GHLContactPayload,
  cfg: GHLResolvedConfig,
  attempt: number,
  maxAttempts: number,
  startTime: number
): Promise<GHLResult> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${cfg.apiKey}`,
    Version: cfg.apiVersion,
  }

  const payload = {
    ...contact,
    locationId: cfg.locationId,
    source: contact.source || cfg.defaultSource,
  }

  // Step 1: Search by email
  let existingContactId: string | null = null
  let existingTags: string[] = []
  try {
    const searchUrl = `${cfg.baseUrl}/contacts/?locationId=${cfg.locationId}&query=${encodeURIComponent(contact.email)}`
    const searchRes = await fetchWithTimeout(searchUrl, { method: "GET", headers }, cfg.timeoutMs)
    if (searchRes.ok) {
      const searchData = await searchRes.json()
      if (searchData.contacts?.length > 0) {
        existingContactId = searchData.contacts[0].id
        existingTags = searchData.contacts[0].tags || []
      }
    }
  } catch {
    // Search failed, will try to create
  }

  // Merge tags: existing + new (no duplicates)
  const mergedTags = [...new Set([...existingTags, ...contact.tags])]
  payload.tags = mergedTags

  // Sanitize payload for logs (no API key)
  const safePayload = { ...payload }

  let action: "created" | "updated"
  let res: Response

  if (existingContactId) {
    action = "updated"
    const { email: _email, ...updatePayload } = payload
    res = await fetchWithTimeout(
      `${cfg.baseUrl}/contacts/${existingContactId}`,
      { method: "PUT", headers, body: JSON.stringify(updatePayload) },
      cfg.timeoutMs
    )
  } else {
    action = "created"
    res = await fetchWithTimeout(
      `${cfg.baseUrl}/contacts/`,
      { method: "POST", headers, body: JSON.stringify(payload) },
      cfg.timeoutMs
    )
  }

  const responseBody = await safeReadBody(res)
  const contactId = parseContactId(responseBody, existingContactId)

  if (res.ok) {
    return makeResult(action, "success",
      `Contacto ${action === "created" ? "CREADO" : "ACTUALIZADO"} en GHL. Tags: ${mergedTags.join(", ")}`,
      res.status, contactId, attempt, maxAttempts, startTime, safePayload
    )
  }

  // 422 = rejected (bad data), no retry
  if (res.status === 422) {
    return makeResult(action, "rejected",
      `GHL rechazo el contacto (422): ${responseBody.slice(0, 300)}`,
      res.status, contactId, attempt, maxAttempts, startTime, safePayload, responseBody
    )
  }

  // Other errors: retryable
  return makeResult("failed", "error",
    `Error HTTP ${res.status}: ${responseBody.slice(0, 300)}`,
    res.status, contactId, attempt, maxAttempts, startTime, safePayload, responseBody
  )
}

// ─── Core: send to webhook ─────────────────────────────────────────

export async function sendToWebhook(
  webhookUrl: string,
  payload: Record<string, unknown>
): Promise<GHLResult> {
  const startTime = Date.now()
  const cfg = resolveGHLConfig()
  const maxAttempts = (cfg?.retryCount || 2) + 1
  const timeoutMs = cfg?.timeoutMs || 10000

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetchWithTimeout(
        webhookUrl,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-MagicFunnel-Source": (cfg?.defaultSource || "magic-funnel"),
          },
          body: JSON.stringify(payload),
        },
        timeoutMs
      )

      const responseBody = await safeReadBody(res)

      if (res.ok) {
        return makeResult("webhook_sent", "success",
          "Webhook enviado exitosamente.",
          res.status, null, attempt, maxAttempts, startTime, payload, responseBody
        )
      }

      if (attempt >= maxAttempts) {
        return makeResult("failed", "error",
          `Webhook error HTTP ${res.status}: ${responseBody.slice(0, 300)}`,
          res.status, null, attempt, maxAttempts, startTime, payload, responseBody
        )
      }
      await sleep(backoff(attempt))
    } catch (err) {
      if (attempt >= maxAttempts) {
        return makeResult("failed", "error",
          `Webhook fallo tras ${maxAttempts} intentos: ${err instanceof Error ? err.message : "desconocido"}`,
          null, null, attempt, maxAttempts, startTime, payload
        )
      }
      await sleep(backoff(attempt))
    }
  }

  return makeResult("failed", "error", "Error inesperado en webhook.", null, null, maxAttempts, maxAttempts, startTime, payload)
}

// ─── Helpers ───────────────────────────────────────────────────────

function makeResult(
  action: GHLResult["action"],
  status: GHLResult["status"],
  message: string,
  httpCode: number | null,
  contactId: string | null,
  attempt: number,
  maxAttempts: number,
  startTime: number,
  payloadSent: Record<string, unknown>,
  responseBody?: string | null,
): GHLResult {
  return {
    action, status, message, httpCode, contactId,
    attempt, maxAttempts,
    elapsed: `${Date.now() - startTime}ms`,
    payloadSent,
    responseBody: responseBody ?? null,
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

async function safeReadBody(res: Response): Promise<string> {
  try {
    const text = await res.text()
    return text.length > 1500 ? text.slice(0, 1500) + "..." : text
  } catch {
    return "(no se pudo leer la respuesta)"
  }
}

function parseContactId(responseBody: string, fallback: string | null): string | null {
  if (fallback) return fallback
  try {
    const parsed = JSON.parse(responseBody)
    return parsed.contact?.id || parsed.id || null
  } catch {
    return null
  }
}

function backoff(attempt: number): number {
  return Math.min(1000 * Math.pow(2, attempt - 1), 8000)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
