import { getSession, createSession } from "@/lib/auth/session"
import { NextResponse } from "next/server"
import { bootstrapSuperAdmin } from "@/lib/server/bootstrap-admin"
import { TEAM_MEMBERS } from "@/lib/team-data"

export async function GET() {
    try {
        const session = await getSession()
        if (!session || !session.user) {
            return NextResponse.json({ authenticated: false }, { status: 401 })
        }

        // Auto-bootstrap: ensure super_admin DB row stays in sync on every session init
        const user = session.user as Record<string, unknown>
        const email = (user.email as string | undefined) ?? ""
        const userId = (user.memberId as string | undefined) || email
        if (email) void bootstrapSuperAdmin(email, userId)

        // Patch stale sessions: static team members always have hasCommunity=true
        const isTeamMember = TEAM_MEMBERS.some(
            (m) => m.email.toLowerCase() === email || m.id === (user.memberId as string | undefined)
        )
        if (isTeamMember && !user.hasCommunity) {
            const patchedUser = { ...user, hasCommunity: true }
            void createSession(patchedUser)
            return NextResponse.json({ authenticated: true, user: patchedUser })
        }

        return NextResponse.json({ authenticated: true, user: session.user })
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 })
    }
}
