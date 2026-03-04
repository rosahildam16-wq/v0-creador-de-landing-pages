import { NextRequest, NextResponse } from "next/server"
import {
  requireAdminSession,
  requireRole,
  getActorId,
  getRequestMeta,
  type AdminRole,
} from "@/lib/server/admin-guard"
import { logAuditEvent } from "@/lib/server/audit"
import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

const ALLOWED: AdminRole[] = ["super_admin"]

/**
 * GET /api/admin/roles
 * Lists all admin_roles entries (active + revoked history).
 * super_admin only.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ALLOWED)
  if (!roleCheck.ok) return roleCheck.response

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

  const { data, error } = await db
    .from("admin_roles")
    .select("id, user_id, role, granted_by, active, revoked_at, revoked_by, created_at")
    .order("created_at", { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ roles: data ?? [] })
}

/**
 * POST /api/admin/roles
 * Grants an admin role to a user.
 * Body: { user_id: string, role: AdminRole }
 * super_admin only.
 */
export async function POST(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ALLOWED)
  if (!roleCheck.ok) return roleCheck.response

  const db = createAdminClient()
  if (!db) return NextResponse.json({ error: "DB no disponible" }, { status: 500 })

  const actorId = getActorId(guard.user)
  const meta = getRequestMeta(request)

  let body: { user_id?: string; role?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { user_id, role } = body

  if (!user_id?.trim()) {
    return NextResponse.json({ error: "Se requiere user_id" }, { status: 400 })
  }

  const VALID_ROLES: AdminRole[] = [
    "super_admin",
    "admin",
    "finance_admin",
    "support_admin",
    "compliance_admin",
  ]

  if (!role || !VALID_ROLES.includes(role as AdminRole)) {
    return NextResponse.json(
      { error: `Rol inválido. Valores permitidos: ${VALID_ROLES.join(", ")}` },
      { status: 400 }
    )
  }

  // Check if user already has an active role
  const { data: existing } = await db
    .from("admin_roles")
    .select("id, role")
    .eq("user_id", user_id.trim())
    .eq("active", true)
    .maybeSingle()

  if (existing) {
    return NextResponse.json(
      { error: `El usuario ya tiene el rol activo: ${existing.role}. Revócalo primero.` },
      { status: 409 }
    )
  }

  // Check super_admin limit (max 2) before insert
  if (role === "super_admin") {
    const { count } = await db
      .from("admin_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "super_admin")
      .eq("active", true)

    if ((count ?? 0) >= 2) {
      return NextResponse.json(
        { error: "Límite alcanzado: máximo 2 super_admin activos permitidos." },
        { status: 422 }
      )
    }
  }

  const { data: newRole, error: insertError } = await db
    .from("admin_roles")
    .insert({
      user_id: user_id.trim(),
      role: role as AdminRole,
      granted_by: actorId,
      active: true,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  void logAuditEvent({
    actor_user_id: actorId,
    actor_role: guard.user.role,
    action_type: "grant_role",
    target_type: "user",
    target_id: user_id.trim(),
    payload: { role, granted_role_id: newRole.id },
    ...meta,
  })

  return NextResponse.json({ ok: true, role: newRole }, { status: 201 })
}
