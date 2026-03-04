import "server-only"
import { cookies } from "next/headers"
import { encrypt, decrypt } from "@/lib/auth/session"
import { logAuditEvent } from "./audit"

export const IMPERSONATION_COOKIE = "mf_impersonate"

export interface ImpersonationSession {
  /** Original admin user data (so we can restore after ending impersonation) */
  adminUser: Record<string, unknown>
  /** User being impersonated */
  targetUser: Record<string, unknown>
  /** Target user id */
  targetUserId: string
  /** Reason the admin provided */
  reason: string
  /** Actor info */
  actorId: string
  actorRole: string
  /** ISO timestamp when impersonation started */
  startedAt: string
}

/**
 * Starts an impersonation session.
 * - Writes admin identity into a separate secure cookie (mf_impersonate)
 * - Replaces mf_session with the target user's data
 * - Logs audit event
 */
export async function startImpersonation(
  adminUser: Record<string, unknown>,
  targetUser: Record<string, unknown>,
  reason: string,
  ip?: string,
  userAgent?: string
): Promise<void> {
  const actorId   = (adminUser.memberId as string) || (adminUser.email as string) || "unknown"
  const actorRole = (adminUser.role as string) || "unknown"
  const targetId  = (targetUser.memberId as string) || (targetUser.id as string) || "unknown"

  const impersonationData: ImpersonationSession = {
    adminUser,
    targetUser,
    targetUserId: targetId,
    reason,
    actorId,
    actorRole,
    startedAt: new Date().toISOString(),
  }

  const cookieStore = await cookies()
  const expires = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2-hour max session

  // Store original admin in a separate cookie
  cookieStore.set(IMPERSONATION_COOKIE, await encrypt({ impersonation: impersonationData, expires }), {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  })

  // Replace main session with target user (+ impersonation flag)
  const impersonatedUserData = {
    ...targetUser,
    _impersonating: true,
    _impersonatedBy: actorId,
  }
  await encrypt({ user: impersonatedUserData, expires })
  cookieStore.set("mf_session", await encrypt({ user: impersonatedUserData, expires }), {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  })

  // Audit
  void logAuditEvent({
    actor_user_id: actorId,
    actor_role:    actorRole,
    action_type:   "impersonation_start",
    target_type:   "user",
    target_id:     targetId,
    payload: {
      target_email: targetUser.email,
      target_name:  targetUser.name,
    },
    reason,
    ip,
    user_agent: userAgent,
  })
}

/**
 * Ends impersonation and restores the admin's original session.
 */
export async function endImpersonation(
  ip?: string,
  userAgent?: string
): Promise<{ ok: boolean; redirectTo: string }> {
  const cookieStore = await cookies()
  const impersonateCookie = cookieStore.get(IMPERSONATION_COOKIE)?.value

  if (!impersonateCookie) {
    return { ok: false, redirectTo: "/admin" }
  }

  let session: { impersonation: ImpersonationSession } | null = null
  try {
    session = await decrypt(impersonateCookie)
  } catch {
    cookieStore.delete(IMPERSONATION_COOKIE)
    return { ok: false, redirectTo: "/admin" }
  }

  const imp = session?.impersonation
  if (!imp) {
    cookieStore.delete(IMPERSONATION_COOKIE)
    return { ok: false, redirectTo: "/admin" }
  }

  // Restore admin session
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  cookieStore.set("mf_session", await encrypt({ user: imp.adminUser, expires }), {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  })

  // Clear impersonation cookie
  cookieStore.delete(IMPERSONATION_COOKIE)

  // Audit
  void logAuditEvent({
    actor_user_id: imp.actorId,
    actor_role:    imp.actorRole,
    action_type:   "impersonation_end",
    target_type:   "user",
    target_id:     imp.targetUserId,
    payload: {
      duration_ms: Date.now() - new Date(imp.startedAt).getTime(),
    },
    reason:     imp.reason,
    ip,
    user_agent: userAgent,
  })

  return { ok: true, redirectTo: "/admin" }
}

/**
 * Reads the current impersonation session from the cookie (server-side).
 * Returns null if not impersonating.
 */
export async function getImpersonationSession(): Promise<ImpersonationSession | null> {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get(IMPERSONATION_COOKIE)?.value
    if (!raw) return null
    const session = await decrypt(raw)
    return session?.impersonation ?? null
  } catch {
    return null
  }
}
