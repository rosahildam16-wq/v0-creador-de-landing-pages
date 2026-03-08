import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

export interface AuditEventParams {
  actor_user_id: string
  actor_role: string
  action_type: string
  target_type?: string
  target_id?: string
  /** Before/after snapshot or extra context */
  payload?: Record<string, unknown>
  /** Human-readable justification */
  reason?: string
  ip?: string
  user_agent?: string
}

/**
 * Writes a record to audit_logs via the service-role client (bypasses RLS).
 * Fire-and-forget: never throws. Audit failures must not crash main operations.
 */
export async function logAuditEvent(params: AuditEventParams): Promise<void> {
  try {
    const client = createAdminClient()
    if (!client) {
      console.warn("[audit] Supabase not configured — skipping audit log")
      return
    }

    const { error } = await client.from("audit_logs").insert({
      actor_user_id: params.actor_user_id,
      actor_role:    params.actor_role,
      action_type:   params.action_type,
      target_type:   params.target_type  ?? null,
      target_id:     params.target_id    ?? null,
      payload:       params.payload      ?? null,
      reason:        params.reason       ?? null,
      ip:            params.ip           ?? null,
      user_agent:    params.user_agent   ?? null,
      timestamp:     new Date().toISOString(),
    })

    if (error) {
      console.error("[audit] Insert failed:", error.message)
    }
  } catch (err) {
    console.error("[audit] Unexpected error writing audit log:", err)
  }
}
