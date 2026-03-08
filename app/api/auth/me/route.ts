import { getSession, createSession } from "@/lib/auth/session"
import { NextResponse } from "next/server"
import { bootstrapSuperAdmin } from "@/lib/server/bootstrap-admin"
import { TEAM_MEMBERS } from "@/lib/team-data"
import { normalizePlanCode } from "@/lib/plans"

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

        // Patch stale sessions: sync static team member data (hasCommunity, planCode)
        const teamMember = TEAM_MEMBERS.find(
            (m) => m.email.toLowerCase() === email || m.id === (user.memberId as string | undefined)
        )
        const needsPlanCodePatch = !user.planCode && teamMember?.planCode
        const needsHasCommunityPatch = teamMember && !user.hasCommunity
        if (needsPlanCodePatch || needsHasCommunityPatch) {
            const patchedUser = {
                ...user,
                hasCommunity: teamMember ? true : user.hasCommunity,
                planCode: normalizePlanCode((teamMember?.planCode ?? user.planId) as string | undefined),
            }
            void createSession(patchedUser)
            return NextResponse.json({ authenticated: true, user: patchedUser })
        }

        // Patch: ensure planCode is always present in session
        if (!user.planCode && user.planId) {
            const patchedUser = { ...user, planCode: normalizePlanCode(user.planId as string) }
            void createSession(patchedUser)
            return NextResponse.json({ authenticated: true, user: patchedUser })
        }

        return NextResponse.json({ authenticated: true, user: session.user })
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 })
    }
}
