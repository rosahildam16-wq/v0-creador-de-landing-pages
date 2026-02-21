import { NextResponse } from "next/server"
import { getGHLLogs, getGHLLogStats, getGHLLogById } from "@/lib/ghl-log-store"
import { upsertContact, resolveGHLConfig } from "@/lib/ghl-client"
import { addGHLLog } from "@/lib/ghl-log-store"
import { loadGHLConfigFromDB } from "@/lib/integrations-store"

/**
 * GET /api/admin/ghl-logs?embudoId=xxx&limit=50
 * Returns execution logs for GHL integration.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const embudoId = searchParams.get("embudoId") || undefined
  const limit = parseInt(searchParams.get("limit") || "50", 10)

  const logs = await getGHLLogs(embudoId, limit)
  const stats = await getGHLLogStats()

  return NextResponse.json({ logs, stats })
}

/**
 * POST /api/admin/ghl-logs
 * Retry a failed log entry.
 * Body: { logId: string }
 */
export async function POST(request: Request) {
  try {
    await loadGHLConfigFromDB()
    const body = await request.json()
    const logId = body.logId

    if (!logId) {
      return NextResponse.json({ success: false, error: "logId es requerido" }, { status: 400 })
    }

    const originalLog = await getGHLLogById(logId)
    if (!originalLog) {
      return NextResponse.json({ success: false, error: "Log no encontrado" }, { status: 404 })
    }

    if (originalLog.status === "success") {
      return NextResponse.json({ success: false, error: "Este log ya fue exitoso" }, { status: 400 })
    }

    const cfg = resolveGHLConfig()
    if (!cfg) {
      return NextResponse.json({ success: false, error: "Credenciales GHL no configuradas" }, { status: 400 })
    }

    // Rebuild contact from original payload
    const payload = originalLog.payloadSent
    const result = await upsertContact({
      firstName: (payload.firstName || payload.first_name || "Retry") as string,
      lastName: (payload.lastName || payload.last_name || "") as string,
      email: (payload.email || "") as string,
      phone: (payload.phone || "") as string,
      source: (payload.source || cfg.defaultSource) as string,
      tags: (payload.tags || [originalLog.tag]) as string[],
    })

    const retryLog = await addGHLLog({
      embudoId: originalLog.embudoId,
      embudoNombre: originalLog.embudoNombre,
      leadEmail: originalLog.leadEmail,
      leadNombre: originalLog.leadNombre,
      method: "api",
      action: result.action,
      status: result.status === "retrying" ? "error" : result.status,
      httpCode: result.httpCode,
      contactId: result.contactId,
      attempt: result.attempt,
      maxAttempts: result.maxAttempts,
      elapsed: result.elapsed,
      tag: originalLog.tag,
      payloadSent: result.payloadSent,
      responseBody: result.responseBody,
      error: result.status === "error" ? result.message : undefined,
    })

    return NextResponse.json({
      success: result.status === "success",
      log: retryLog,
      message: result.message,
    })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
