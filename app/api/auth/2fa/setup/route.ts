import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, getActorId, getRequestMeta } from "@/lib/server/admin-guard"
import { generateTOTPSecret, generateBackupCodes, buildOTPAuthURI } from "@/lib/server/totp"
import { logAuditEvent } from "@/lib/server/audit"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

/**
 * POST /api/auth/2fa/setup
 * Generates a new TOTP secret and returns the otpauth URI for QR display.
 * Does NOT enable 2FA — that happens after first successful verify.
 *
 * Returns: { secret, otpauthUri, backupCodes }
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

  const userId = getActorId(guard.user)
  const email  = (guard.user.email as string) ?? userId

  const secret      = generateTOTPSecret()
  const backupCodes = generateBackupCodes()
  const otpauthUri  = buildOTPAuthURI(secret, email)

  // Upsert into admin_2fa (disabled until verified)
  const { error } = await db.from("admin_2fa").upsert({
    user_id:      userId,
    totp_secret:  secret,
    backup_codes: backupCodes,
    enabled:      false,
    updated_at:   new Date().toISOString(),
  }, { onConflict: "user_id" })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  void logAuditEvent({
    actor_user_id: userId,
    actor_role:    guard.user.role,
    action_type:   "2fa.setup_initiated",
    target_type:   "user",
    target_id:     userId,
    ...getRequestMeta(request),
  })

  return NextResponse.json({
    secret,
    otpauthUri,
    backupCodes,
  })
}
