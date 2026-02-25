import { NextResponse } from "next/server"
import { getGHLConfig, setGHLConfig, loadGHLConfigFromDB } from "@/lib/integrations-store"

/**
 * GET /api/integrations/ghl-config
 * Returns the saved GHL config. API Key is masked for security.
 */
export async function GET() {
  await loadGHLConfigFromDB()
  const config = getGHLConfig()
  return NextResponse.json({
    webhookUrl: config?.webhookUrl ?? "",
    apiKey: config?.apiKey ? maskKey(config.apiKey) : "",
    apiKeySet: !!config?.apiKey,
    locationId: config?.locationId ?? "",
    locationIdSet: !!config?.locationId,
    baseUrl: config?.baseUrl ?? "https://services.leadconnectorhq.com",
    apiVersion: config?.apiVersion ?? "2021-07-28",
    defaultSource: config?.defaultSource ?? "magic-funnel",
    timeoutMs: config?.timeoutMs ?? 10000,
    retryCount: config?.retryCount ?? 2,
  })
}

/**
 * PUT /api/integrations/ghl-config
 * Saves/updates GHL config fields.
 * Body: { webhookUrl?, apiKey?, locationId? }
 * Only provided fields are updated; missing fields keep their previous value.
 */
export async function PUT(request: Request) {
  try {
    await loadGHLConfigFromDB()
    const body = await request.json()
    const existing = getGHLConfig()

    // Merge: only update fields that were explicitly sent
    const webhookUrl =
      typeof body.webhookUrl === "string" ? body.webhookUrl.trim() : (existing?.webhookUrl ?? "")
    const apiKey =
      typeof body.apiKey === "string" ? body.apiKey.trim() : (existing?.apiKey ?? "")
    const locationId =
      typeof body.locationId === "string" ? body.locationId.trim() : (existing?.locationId ?? "")

    // Advanced fields
    const baseUrl =
      typeof body.baseUrl === "string" ? body.baseUrl.trim() : (existing?.baseUrl ?? undefined)
    const apiVersion =
      typeof body.apiVersion === "string" ? body.apiVersion.trim() : (existing?.apiVersion ?? undefined)
    const defaultSource =
      typeof body.defaultSource === "string" ? body.defaultSource.trim() : (existing?.defaultSource ?? undefined)
    const timeoutMs =
      typeof body.timeoutMs === "number" ? body.timeoutMs : (existing?.timeoutMs ?? undefined)
    const retryCount =
      typeof body.retryCount === "number" ? body.retryCount : (existing?.retryCount ?? undefined)

    // If webhookUrl was sent explicitly, validate it
    if (typeof body.webhookUrl === "string" && webhookUrl) {
      try {
        new URL(webhookUrl)
      } catch {
        return NextResponse.json(
          { success: false, error: "La Webhook URL proporcionada no es valida." },
          { status: 400 }
        )
      }
    }

    await setGHLConfig({ webhookUrl, apiKey, locationId, baseUrl, apiVersion, defaultSource, timeoutMs, retryCount })

    return NextResponse.json({
      success: true,
      webhookUrl,
      apiKey: apiKey ? maskKey(apiKey) : "",
      apiKeySet: !!apiKey,
      locationId,
      locationIdSet: !!locationId,
      baseUrl: baseUrl ?? "https://services.leadconnectorhq.com",
      apiVersion: apiVersion ?? "2021-07-28",
      defaultSource: defaultSource ?? "magic-funnel",
      timeoutMs: timeoutMs ?? 10000,
      retryCount: retryCount ?? 2,
    })
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Error desconocido",
      },
      { status: 500 }
    )
  }
}

function maskKey(key: string): string {
  if (key.length <= 8) return "****"
  return key.slice(0, 4) + "****" + key.slice(-4)
}
