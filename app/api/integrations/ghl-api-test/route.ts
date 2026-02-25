import { NextResponse } from "next/server"
import { upsertContact, resolveGHLConfig } from "@/lib/ghl-client"
import { addGHLLog } from "@/lib/ghl-log-store"
import { loadGHLConfigFromDB } from "@/lib/integrations-store"

/**
 * POST /api/integrations/ghl-api-test
 * Sends a test contact to GoHighLevel via the centralized ghl-client.
 * Uses upsert logic: search by email, update if exists, create if not.
 */

interface TestBody {
  contact?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    source?: string
    tags?: string[]
  }
}

export async function POST(request: Request) {
  try {
    await loadGHLConfigFromDB()
    const body: TestBody = await request.json().catch(() => ({}))

    const cfg = resolveGHLConfig()
    if (!cfg) {
      return NextResponse.json({
        success: false,
        log: {
          action: "validation",
          status: "error",
          message: "Faltan credenciales. Ingresa tu API Key y Location ID.",
          httpCode: null,
          responseBody: null,
          elapsed: "0ms",
        },
      })
    }

    const ts = Date.now()
    const contact = {
      firstName: body.contact?.firstName?.trim() || "Test",
      lastName: body.contact?.lastName?.trim() || "MagicFunnel",
      email: body.contact?.email?.trim() || `test-${ts}@magicfunnel.test`,
      phone: body.contact?.phone?.trim() || `+5730000${String(ts).slice(-5)}`,
      source: body.contact?.source?.trim() || cfg.defaultSource,
      tags: body.contact?.tags?.length ? body.contact.tags : ["magic-funnel", "mf-api-test"],
    }

    const result = await upsertContact(contact)

    // Log it
    await addGHLLog({
      embudoId: "__test__",
      embudoNombre: "Test Manual",
      leadEmail: contact.email,
      leadNombre: `${contact.firstName} ${contact.lastName}`,
      method: "api",
      action: result.action,
      status: result.status === "retrying" ? "error" : result.status,
      httpCode: result.httpCode,
      contactId: result.contactId,
      attempt: result.attempt,
      maxAttempts: result.maxAttempts,
      elapsed: result.elapsed,
      tag: "mf-api-test",
      payloadSent: result.payloadSent,
      responseBody: result.responseBody,
    })

    return NextResponse.json({
      success: result.status === "success",
      log: {
        action: result.action,
        status: result.status,
        message: result.message,
        httpCode: result.httpCode,
        contactId: result.contactId,
        responseBody: result.responseBody,
        payloadSent: result.payloadSent,
        elapsed: result.elapsed,
      },
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      log: {
        action: "unknown",
        status: "error",
        message: err instanceof Error ? err.message : "Error desconocido",
        httpCode: null,
        responseBody: null,
        elapsed: "0ms",
      },
    })
  }
}
