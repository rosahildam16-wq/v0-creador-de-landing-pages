/**
 * Hybrid log store for GoHighLevel API/webhook executions.
 * When Supabase is configured, persists to ghl_logs table.
 * Otherwise, uses in-memory store (survives hot reloads via globalThis).
 */

export interface GHLLog {
  id: string
  timestamp: string
  embudoId: string
  embudoNombre?: string
  leadEmail: string
  leadNombre: string
  method: "api" | "webhook"
  action: "created" | "updated" | "webhook_sent" | "skipped" | "failed"
  status: "success" | "error" | "rejected"
  httpCode: number | null
  contactId: string | null
  attempt: number
  maxAttempts: number
  elapsed: string
  tag: string
  payloadSent: Record<string, unknown>
  responseBody: string | null
  error?: string
}

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

/** Map a DB row to the GHLLog interface */
function rowToLog(row: Record<string, unknown>): GHLLog {
  return {
    id: row.id as string,
    timestamp: row.created_at as string,
    embudoId: (row.embudo_id as string) ?? "",
    embudoNombre: (row.embudo_nombre as string) ?? undefined,
    leadEmail: row.lead_email as string,
    leadNombre: row.lead_nombre as string,
    method: row.method as GHLLog["method"],
    action: row.action as GHLLog["action"],
    status: row.status as GHLLog["status"],
    httpCode: (row.http_code as number) ?? null,
    contactId: (row.contact_id as string) ?? null,
    attempt: (row.attempt as number) ?? 1,
    maxAttempts: (row.max_attempts as number) ?? 1,
    elapsed: (row.elapsed as string) ?? "",
    tag: (row.tag as string) ?? "",
    payloadSent: (row.payload_sent as Record<string, unknown>) ?? {},
    responseBody: (row.response_body as string) ?? null,
    error: (row.error as string) ?? undefined,
  }
}

// --------------- in-memory fallback ---------------

const MAX_LOGS = 200
const globalStore = globalThis as unknown as { __ghlLogs?: GHLLog[] }
if (!globalStore.__ghlLogs) {
  globalStore.__ghlLogs = []
}
const memoryLogs = globalStore.__ghlLogs

// --------------- public API ---------------

export async function addGHLLog(log: Omit<GHLLog, "id" | "timestamp">): Promise<GHLLog> {
  if (hasSupabase()) {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase
        .from("ghl_logs")
        .insert({
          embudo_id: log.embudoId,
          embudo_nombre: log.embudoNombre ?? null,
          lead_email: log.leadEmail,
          lead_nombre: log.leadNombre,
          method: log.method,
          action: log.action,
          status: log.status,
          http_code: log.httpCode,
          contact_id: log.contactId,
          attempt: log.attempt,
          max_attempts: log.maxAttempts,
          elapsed: log.elapsed,
          tag: log.tag,
          payload_sent: log.payloadSent,
          response_body: log.responseBody,
          error: log.error ?? null,
        })
        .select()
        .single()

      if (error) throw error
      return rowToLog(data as Record<string, unknown>)
    } catch {
      // Fallback to memory if DB insert fails
    }
  }

  // In-memory fallback
  const entry: GHLLog = {
    ...log,
    id: `ghl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
  }
  memoryLogs.unshift(entry)
  if (memoryLogs.length > MAX_LOGS) {
    memoryLogs.length = MAX_LOGS
  }
  return entry
}

export async function getGHLLogs(embudoId?: string, limit = 50): Promise<GHLLog[]> {
  if (hasSupabase()) {
    try {
      const supabase = await getSupabase()
      let query = supabase
        .from("ghl_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit)

      if (embudoId) {
        query = query.eq("embudo_id", embudoId)
      }

      const { data, error } = await query
      if (error) throw error
      return (data ?? []).map((r) => rowToLog(r as Record<string, unknown>))
    } catch {
      // Fallback
    }
  }

  const filtered = embudoId ? memoryLogs.filter((l) => l.embudoId === embudoId) : memoryLogs
  return filtered.slice(0, limit)
}

export async function getGHLLogById(id: string): Promise<GHLLog | undefined> {
  if (hasSupabase()) {
    try {
      const supabase = await getSupabase()
      const { data, error } = await supabase.from("ghl_logs").select("*").eq("id", id).single()
      if (error) throw error
      return rowToLog(data as Record<string, unknown>)
    } catch {
      // Fallback
    }
  }

  return memoryLogs.find((l) => l.id === id)
}

export async function clearGHLLogs(): Promise<void> {
  if (hasSupabase()) {
    try {
      const supabase = await getSupabase()
      await supabase.from("ghl_logs").delete().neq("id", "")
    } catch {
      // Fallback
    }
  }
  memoryLogs.length = 0
}

export async function getGHLLogStats(): Promise<{
  total: number
  success: number
  errors: number
  rejected: number
}> {
  if (hasSupabase()) {
    try {
      const supabase = await getSupabase()
      const { count: total } = await supabase
        .from("ghl_logs")
        .select("*", { count: "exact", head: true })
      const { count: success } = await supabase
        .from("ghl_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "success")
      const { count: errors } = await supabase
        .from("ghl_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "error")
      const { count: rejected } = await supabase
        .from("ghl_logs")
        .select("*", { count: "exact", head: true })
        .eq("status", "rejected")

      return {
        total: total ?? 0,
        success: success ?? 0,
        errors: errors ?? 0,
        rejected: rejected ?? 0,
      }
    } catch {
      // Fallback
    }
  }

  const total = memoryLogs.length
  const success = memoryLogs.filter((l) => l.status === "success").length
  const errors = memoryLogs.filter((l) => l.status === "error").length
  const rejected = memoryLogs.filter((l) => l.status === "rejected").length
  return { total, success, errors, rejected }
}
