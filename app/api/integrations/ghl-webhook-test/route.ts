import { NextResponse } from "next/server"
import { normalizePhone } from "@/lib/phone-utils"
import { getGHLConfig } from "@/lib/integrations-store"

/**
 * POST /api/integrations/ghl-webhook-test
 *
 * Sends a test lead to the configured GHL webhook URL with the new enriched payload.
 * The URL is resolved in this order:
 *   1. webhookUrl from the request body (sent from the UI input)
 *   2. URL saved in the integrations store
 *   3. GHL_WEBHOOK_URL environment variable (legacy fallback)
 *
 * Returns full debug info (status, headers, response body, payload sent).
 */

interface TestConfig {
  webhookUrl?: string
  computedTags?: string[]
  defaultTags?: string[]
  source?: string
  eventName?: string
  funnelStep?: string
  phoneCountryCode?: string
}

export async function POST(request: Request) {
  try {
    const config: TestConfig = await request.json().catch(() => ({}))

    // Resolve webhook URL: body > store > env var
    const storedConfig = getGHLConfig()
    const webhookUrl =
      config.webhookUrl?.trim() ||
      storedConfig?.webhookUrl ||
      process.env.GHL_WEBHOOK_URL

    if (!webhookUrl) {
      return NextResponse.json({
        success: false,
        debug: {
          status: "error",
          httpCode: null,
          responseBody: null,
          error: "No hay Webhook URL configurada. Pega la URL en el campo de arriba y guarda.",
          payloadSent: null,
        },
      })
    }

    // Build the enriched payload
    const countryCode = config.phoneCountryCode || "+57"
    const source = config.source || "magic-funnel"
    const eventName = config.eventName || "lead_created"
    const funnelStep = config.funnelStep || "landing_view"
    // Use precomputed tags from the UI (already includes system + event + custom tags)
    const tags = config.computedTags?.length
      ? config.computedTags
      : config.defaultTags?.length
        ? ["magic-funnel", "mf-ghl", "mf-lead", ...config.defaultTags]
        : ["magic-funnel", "mf-ghl", "mf-lead", "nomada-vip"]
    const now = new Date()

    const payload = {
      first_name: "Test",
      last_name: "",
      email: "test@mail.com",
      phone: normalizePhone("300 111 2233", countryCode),
      source,
      tags,
      event: eventName,
      funnel_step: funnelStep,
      timestamp: now.toISOString(),
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-MagicFunnel-Source": source,
      "X-MagicFunnel-Event": eventName,
      // HMAC signature placeholder – ready for future implementation
      // "X-MagicFunnel-Signature": computeHmac(payload, secret),
    }

    const startTime = Date.now()
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })
    const elapsed = Date.now() - startTime

    let responseBody: string
    try {
      responseBody = await res.text()
      // Truncate to 500 chars for debug display
      if (responseBody.length > 500) {
        responseBody = responseBody.slice(0, 500) + "..."
      }
    } catch {
      responseBody = "(no se pudo leer la respuesta)"
    }

    return NextResponse.json({
      success: res.ok,
      debug: {
        status: res.ok ? "success" : "error",
        httpCode: res.status,
        responseTime: `${elapsed}ms`,
        responseBody,
        payloadSent: payload,
        headersSent: {
          "Content-Type": headers["Content-Type"],
          "X-MagicFunnel-Source": headers["X-MagicFunnel-Source"],
          "X-MagicFunnel-Event": headers["X-MagicFunnel-Event"],
        },
      },
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      debug: {
        status: "error",
        httpCode: null,
        responseBody: null,
        error: err instanceof Error ? err.message : "Error desconocido",
        payloadSent: null,
      },
    })
  }
}
