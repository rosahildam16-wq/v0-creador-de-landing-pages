import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, getActorId, getRequestMeta } from "@/lib/server/admin-guard"
import { verifyTOTP } from "@/lib/server/totp"
import { logAuditEvent } from "@/lib/server/audit"
import { createAdminClient } from "@/lib/supabase/admin"
import { createSession } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

/**
 * POST /api/auth/2fa/verify
 * Body: { code: string }
 *
 * Verifies a TOTP code against the user's stored secret.
 *   - On first use (enabled=false): enables 2FA and marks as verified.
 *   - On subsequent logins: validates and sets 2fa_verified flag in session.
 *
 * Returns: { ok: true } or 401.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

  const userId = getActorId(guard.user)
  const meta   = getRequestMeta(request)

  let body: { code?: string }
  try { body = await request.json() } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  if (!body.code?.trim()) {
    return NextResponse.json({ error: "Se requiere: code" }, { status: 400 })
  }

  // Fetch the user's 2FA record
  const { data: record, error: fetchErr } = await db
    .from("admin_2fa")
    .select("totp_secret, backup_codes, enabled")
    .eq("user_id", userId)
    .maybeSingle()

  if (fetchErr || !record) {
    return NextResponse.json({ error: "2FA no configurado. Ejecuta /api/auth/2fa/setup primero." }, { status: 400 })
  }

  const code = body.code.replace(/\s/g, "").trim()

  // Check TOTP code
  let valid = verifyTOTP(record.totp_secret, code)

  // Check backup codes if TOTP failed
  let usedBackup = false
  if (!valid && Array.isArray(record.backup_codes)) {
    const idx = record.backup_codes.indexOf(code)
    if (idx >= 0) {
      valid = true
      usedBackup = true
      // Remove used backup code
      const remaining = [...record.backup_codes]
      remaining.splice(idx, 1)
      await db
        .from("admin_2fa")
        .update({ backup_codes: remaining, updated_at: new Date().toISOString() })
        .eq("user_id", userId)
    }
  }

  if (!valid) {
    void logAuditEvent({
      actor_user_id: userId,
      actor_role:    guard.user.role,
      action_type:   "2fa.verify_failed",
      target_type:   "user",
      target_id:     userId,
      ...meta,
    })
    return NextResponse.json({ error: "Código inválido o expirado" }, { status: 401 })
  }

  // First verification: enable 2FA
  if (!record.enabled) {
    await db
      .from("admin_2fa")
      .update({
        enabled:     true,
        verified_at: new Date().toISOString(),
        updated_at:  new Date().toISOString(),
      })
      .eq("user_id", userId)
  }

  // Update last_used_at
  await db
    .from("admin_2fa")
    .update({ last_used_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("user_id", userId)

  // Stamp the session with 2fa_verified = true
  await createSession({
    ...guard.user,
    twofa_verified: true,
    twofa_at:       new Date().toISOString(),
  })

  void logAuditEvent({
    actor_user_id: userId,
    actor_role:    guard.user.role,
    action_type:   record.enabled ? "2fa.verify_success" : "2fa.setup_complete",
    target_type:   "user",
    target_id:     userId,
    payload:       { used_backup_code: usedBackup },
    ...meta,
  })

  return NextResponse.json({ ok: true, enabled: true })
}
