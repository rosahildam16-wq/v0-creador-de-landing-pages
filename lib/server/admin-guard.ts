import "server-only"
import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth/session"

export type AdminRole =
  | "super_admin"
  | "admin"
  | "finance_admin"
  | "support_admin"
  | "compliance_admin"

const ADMIN_ROLES = new Set<string>([
  "super_admin",
  "admin",
  "finance_admin",
  "support_admin",
  "compliance_admin",
])

export function isAdminRole(role: string): role is AdminRole {
  return ADMIN_ROLES.has(role)
}

/** Reads and decrypts the mf_session cookie from an API request. */
async function getSessionUser(
  request: NextRequest
): Promise<Record<string, unknown> | null> {
  try {
    const token = request.cookies.get("mf_session")?.value
    if (!token) return null
    const session = await decrypt(token)
    return (session?.user as Record<string, unknown>) ?? null
  } catch {
    return null
  }
}

type AdminGuardResult =
  | { ok: true; user: Record<string, unknown> & { role: AdminRole } }
  | { ok: false; response: NextResponse }

/**
 * Use at the top of admin API route handlers.
 *
 * @example
 * const guard = await requireAdminSession(request)
 * if (!guard.ok) return guard.response
 * const { user } = guard
 */
export async function requireAdminSession(
  request: NextRequest
): Promise<AdminGuardResult> {
  const user = await getSessionUser(request)

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "No autenticado" }, { status: 401 }),
    }
  }

  const role = user.role as string | undefined
  if (!role || !isAdminRole(role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Acceso denegado" }, { status: 403 }),
    }
  }

  return { ok: true, user: { ...user, role } }
}

/**
 * Checks that the authenticated admin's role is in the allowed list.
 * Use AFTER requireAdminSession.
 *
 * @example
 * const guard = await requireAdminSession(request)
 * if (!guard.ok) return guard.response
 * const roleCheck = requireRole(guard.user.role, ["super_admin", "finance_admin"])
 * if (!roleCheck.ok) return roleCheck.response
 */
export function requireRole(
  role: AdminRole,
  allowed: AdminRole[]
): { ok: true } | { ok: false; response: NextResponse } {
  if (!allowed.includes(role)) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: `Acceso denegado. Se requiere uno de: ${allowed.join(", ")}` },
        { status: 403 }
      ),
    }
  }
  return { ok: true }
}

/** Helper to extract IP + user-agent from a request for audit logging. */
export function getRequestMeta(request: NextRequest) {
  return {
    ip: request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? undefined,
    user_agent: request.headers.get("user-agent") ?? undefined,
  }
}

/** Canonical actor ID for audit logs — prefers memberId, falls back to email. */
export function getActorId(user: Record<string, unknown>): string {
  return (user.memberId as string) || (user.email as string) || "unknown"
}
