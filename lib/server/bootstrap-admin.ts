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
 * @param email   The authenticated user's email (compared against BOOTSTRAP_EMAIL).
 * @param userId  The stable user identifier to store as admin_roles.user_id
 *                (memberId if available, otherwise email).
 *
 * Strategy:
 *  1. Skip if email doesn't match bootstrap email.
 *  2. If active super_admin row for this userId already exists → done (idempotent).
 *  3. Soft-revoke any other active role for this userId (unique partial index).
 *  4. Insert super_admin row with granted_by='bootstrap'.
 */
export async function bootstrapSuperAdmin(
  email: string,
  userId: string
): Promise<void> {
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
      .eq("user_id", userId)
      .eq("role", "super_admin")
      .eq("active", true)
      .maybeSingle()

    if (existing) {
      console.info("[bootstrap] skipped — super_admin already active for user")
      return
    }

    // 2. Revoke any conflicting active role (satisfies unique partial index on user_id WHERE active)
    await db
      .from("admin_roles")
      .update({
        active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: "bootstrap",
      })
      .eq("user_id", userId)
      .eq("active", true)

    // 3. Insert fresh super_admin
    const { error } = await db.from("admin_roles").insert({
      user_id: userId,
      role: "super_admin",
      granted_by: "bootstrap",
      active: true,
    })

    if (error) {
      console.error("[bootstrap] insert super_admin failed:", error.message)
    } else {
      console.info("[bootstrap] applied — super_admin row created")
    }
  } catch (err) {
    console.error("[bootstrap] unexpected error:", err)
  }
}
