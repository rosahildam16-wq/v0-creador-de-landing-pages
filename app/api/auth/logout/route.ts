import { deleteSession, decrypt } from "@/lib/auth/session"
import { NextRequest, NextResponse } from "next/server"
import { logAuditEvent } from "@/lib/server/audit"
import { isAdminRole } from "@/lib/server/admin-guard"

export async function POST(req: NextRequest) {
    // Capture admin identity before destroying the session
    try {
        const token = req.cookies.get("mf_session")?.value
        if (token) {
            const session = await decrypt(token)
            const user = session?.user as Record<string, unknown> | undefined
            if (user && isAdminRole((user.role as string) ?? "")) {
                void logAuditEvent({
                    actor_user_id: (user.memberId as string) || (user.email as string) || "unknown",
                    actor_role:    (user.role as string) ?? "unknown",
                    action_type:   "logout_admin",
                    target_type:   "auth",
                    payload:       { email: user.email },
                    ip:            req.headers.get("x-forwarded-for") ?? undefined,
                    user_agent:    req.headers.get("user-agent") ?? undefined,
                })
            }
        }
    } catch {
        // Never block logout due to audit failure
    }

    await deleteSession()
    return NextResponse.json({ success: true })
}
