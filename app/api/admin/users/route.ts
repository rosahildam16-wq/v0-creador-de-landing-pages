import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, requireRole, getRequestMeta, getActorId } from "@/lib/server/admin-guard"
import { logAuditEvent } from "@/lib/server/audit"
import { createAdminClient } from "@/lib/supabase/admin"

// Access matrix:
//   GET    → super_admin, admin, support_admin (support gets limited fields)
//   POST   → super_admin, admin
//   PATCH  → super_admin, admin, support_admin (support limited: reset pw / resend)
//   DELETE → super_admin only

// Fields excluded for support_admin (no raw passwords)
const SUPPORT_SAFE_FIELDS = "id, member_id, name, username, email, role, community_id, sponsor_username, activo, trial_ends_at, created_at, plan_code"
const FULL_FIELDS          = "id, member_id, name, username, email, password_plain, password_hash, role, community_id, sponsor_username, activo, trial_ends_at, created_at, plan_code"

// PATCH operations allowed per role
const SUPPORT_ALLOWED_UPDATES = new Set(["activo", "trial_ends_at"])

export async function GET(req: NextRequest) {
  const guard = await requireAdminSession(req)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ["super_admin", "admin", "support_admin"])
  if (!roleCheck.ok) return roleCheck.response

  try {
    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })

    // support_admin gets no passwords
    const fields = guard.user.role === "support_admin" ? SUPPORT_SAFE_FIELDS : FULL_FIELDS

    const { data: users, error } = await supabase
      .from("community_members")
      .select(fields)
      .order("created_at", { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const mapped = (users || []).map((u: Record<string, unknown>) => {
      const base = {
        id:              u.id,
        memberId:        u.member_id,
        name:            u.name,
        username:        u.username,
        email:           u.email,
        role:            u.role,
        communityId:     u.community_id,
        // Sponsor always shown as locked — never editable
        sponsorUsername: u.sponsor_username ?? null,
        activo:          u.activo,
        trialEndsAt:     u.trial_ends_at,
        createdAt:       u.created_at,
        planCode:        (u.plan_code as string | null) ?? "27",
      }
      if (guard.user.role !== "support_admin") {
        return { ...base, password: (u.password_plain || u.password_hash || "N/A") as string }
      }
      return base
    })

    return NextResponse.json({ users: mapped })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const guard = await requireAdminSession(req)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ["super_admin", "admin"])
  if (!roleCheck.ok) return roleCheck.response

  try {
    const body = await req.json()
    const { userData } = body

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })

    const { error } = await supabase.from("community_members").insert({
      member_id:      `reg-${(userData.username as string).toLowerCase()}`,
      community_id:   userData.communityId || "general",
      email:          userData.email,
      name:           userData.name,
      username:       (userData.username as string).toLowerCase(),
      password_hash:  userData.password,
      password_plain: userData.password,
      role:           userData.role || "member",
      trial_ends_at:  new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      activo:         true,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    void logAuditEvent({
      actor_user_id: getActorId(guard.user),
      actor_role:    guard.user.role,
      action_type:   "user.create",
      target_type:   "user",
      target_id:     userData.email as string,
      payload:       { email: userData.email, role: userData.role || "member" },
      ...getRequestMeta(req),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireAdminSession(req)
  if (!guard.ok) return guard.response

  const roleCheck = requireRole(guard.user.role, ["super_admin", "admin", "support_admin"])
  if (!roleCheck.ok) return roleCheck.response

  try {
    const body = await req.json()
    const { userId, updates } = body as { userId: string; updates: Record<string, unknown> }

    if (!userId) return NextResponse.json({ error: "ID requerido" }, { status: 400 })
    if (!updates || typeof updates !== "object") {
      return NextResponse.json({ error: "updates requerido" }, { status: 400 })
    }

    // Support admin can only toggle activo or trial_ends_at (reset/unblock)
    if (guard.user.role === "support_admin") {
      const forbidden = Object.keys(updates).filter((k) => !SUPPORT_ALLOWED_UPDATES.has(k))
      if (forbidden.length > 0) {
        return NextResponse.json(
          { error: `support_admin no puede modificar: ${forbidden.join(", ")}` },
          { status: 403 }
        )
      }
    }

    // Block sponsor modification from API (belt & suspenders — DB trigger also blocks)
    if ("sponsor_username" in updates || "sponsor_user_id" in updates) {
      void logAuditEvent({
        actor_user_id: getActorId(guard.user),
        actor_role:    guard.user.role,
        action_type:   "sponsor_change_attempt",
        target_type:   "user",
        target_id:     userId,
        payload:       { attempted_update: updates },
        reason:        "Blocked by compliance — sponsor is immutable",
        ...getRequestMeta(req),
      })
      return NextResponse.json(
        { error: "El patrocinador no puede modificarse (compliance). Sponsor is permanently locked." },
        { status: 403 }
      )
    }

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })

    const { error } = await supabase
      .from("community_members")
      .update(updates)
      .eq("id", userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    void logAuditEvent({
      actor_user_id: getActorId(guard.user),
      actor_role:    guard.user.role,
      action_type:   "user.update",
      target_type:   "user",
      target_id:     userId,
      payload:       { fields_updated: Object.keys(updates) },
      ...getRequestMeta(req),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const guard = await requireAdminSession(req)
  if (!guard.ok) return guard.response

  // Only super_admin can delete users
  const roleCheck = requireRole(guard.user.role, ["super_admin"])
  if (!roleCheck.ok) return roleCheck.response

  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("id")

    if (!userId) return NextResponse.json({ error: "ID requerido" }, { status: 400 })

    const supabase = createAdminClient()
    if (!supabase) return NextResponse.json({ error: "Base de datos no disponible" }, { status: 500 })

    const { data: user } = await supabase
      .from("community_members")
      .select("username, email, name")
      .eq("id", userId)
      .single()

    if (user) {
      await supabase.from("communities").delete().eq("owner_username", user.username)
      await supabase.from("subscriptions").delete().eq("user_email", user.email)
    }

    const { error } = await supabase.from("community_members").delete().eq("id", userId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    void logAuditEvent({
      actor_user_id: getActorId(guard.user),
      actor_role:    guard.user.role,
      action_type:   "user.delete",
      target_type:   "user",
      target_id:     userId,
      payload:       { email: user?.email, name: user?.name },
      ...getRequestMeta(req),
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
