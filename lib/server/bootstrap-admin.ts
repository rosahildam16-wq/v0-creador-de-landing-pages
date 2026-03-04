import "server-only"
import { createAdminClient } from "@/lib/supabase/admin"

const BOOTSTRAP_EMAIL = (
  process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "iajorgeleon21@gmail.com"
).trim().toLowerCase()

/**
 * Ensures the super-admin email always has an active super_admin row in
 * public.admin_roles.  Safe to call on every login / session init — it is a
 * no-op when the row already exists.
 *
 * Strategy:
 *  1. If active super_admin row exists → done (idempotent).
 *  2. Soft-revoke any other active role for this user (unique partial index).
 *  3. Insert super_admin row granted_by='bootstrap'.
 */
export async function bootstrapSuperAdmin(email: string): Promise<void> {
  if (email.trim().toLowerCase() !== BOOTSTRAP_EMAIL) return

  const db = createAdminClient()
  if (!db) {
    console.warn("[bootstrap] Supabase not configured — skipping super_admin bootstrap")
    return
  }

  try {
    // 1. Already bootstrapped?
    const { data: existing } = await db
      .from("admin_roles")
      .select("id")
      .eq("user_id", BOOTSTRAP_EMAIL)
      .eq("role", "super_admin")
      .eq("active", true)
      .maybeSingle()

    if (existing) return // Nothing to do

    // 2. Revoke any conflicting active role (satisfies unique partial index on user_id WHERE active)
    await db
      .from("admin_roles")
      .update({
        active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: "bootstrap",
      })
      .eq("user_id", BOOTSTRAP_EMAIL)
      .eq("active", true)

    // 3. Insert fresh super_admin
    const { error } = await db.from("admin_roles").insert({
      user_id: BOOTSTRAP_EMAIL,
      role: "super_admin",
      granted_by: "bootstrap",
      active: true,
    })

    if (error) {
      console.error("[bootstrap] Insert super_admin failed:", error.message)
    } else {
      console.info("[bootstrap] super_admin row created for", BOOTSTRAP_EMAIL)
    }
  } catch (err) {
    console.error("[bootstrap] Unexpected error:", err)
  }
}
