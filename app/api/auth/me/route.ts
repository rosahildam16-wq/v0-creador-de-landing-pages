import { getSession, createSession } from "@/lib/auth/session"
import { NextResponse } from "next/server"
import { bootstrapSuperAdmin } from "@/lib/server/bootstrap-admin"
import { TEAM_MEMBERS } from "@/lib/team-data"
import { normalizePlanCode } from "@/lib/plans"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
    try {
        const session = await getSession()
        if (!session || !session.user) {
            return NextResponse.json({ authenticated: false }, { status: 401 })
        }

        // Auto-bootstrap: ensure super_admin DB row stays in sync on every session init
        const user = session.user as Record<string, unknown>
        const email = (user.email as string | undefined) ?? ""
        const memberId = (user.memberId as string | undefined) || ""
        if (email) void bootstrapSuperAdmin(email, memberId || email)

        // ── DB plan sync: always refresh plan_code from DB so admin upgrades take
        //    effect immediately on next navigation, without requiring re-login.
        // Skip for super_admin (no DB plan row needed).
        let dbPlanCode: string | null = null
        if (user.role !== "super_admin" && (email || memberId)) {
            try {
                const supabase = createAdminClient()
                if (supabase) {
                    const orFilter = [
                        email    ? `email.eq.${email}`       : null,
                        memberId ? `member_id.eq.${memberId}` : null,
                    ].filter(Boolean).join(",")

                    const { data: memberRow } = await supabase
                        .from("community_members")
                        .select("plan_code")
                        .or(orFilter)
                        .maybeSingle()

                    if (memberRow?.plan_code) {
                        dbPlanCode = normalizePlanCode(memberRow.plan_code)
                    }
                }
            } catch {
                // DB unavailable — fall through, use session planCode
            }
        }

        // Patch stale sessions: sync static team member data (hasCommunity, planCode)
        const teamMember = TEAM_MEMBERS.find(
            (m) => m.email.toLowerCase() === email || m.id === memberId
        )

        // Determine final planCode:
        //   1. DB plan_code (admin override wins)
        //   2. TEAM_MEMBERS planCode
        //   3. Session planCode / planId
        const resolvedPlanCode = dbPlanCode
            ?? (teamMember?.planCode ? normalizePlanCode(teamMember.planCode) : null)
            ?? (user.planCode as string | undefined)
            ?? (user.planId ? normalizePlanCode(user.planId as string) : "27")

        const needsPatch = resolvedPlanCode !== user.planCode
            || (teamMember && !user.hasCommunity)

        if (needsPatch) {
            const patchedUser = {
                ...user,
                hasCommunity: teamMember ? true : user.hasCommunity,
                planCode: resolvedPlanCode,
            }
            void createSession(patchedUser)
            return NextResponse.json({ authenticated: true, user: patchedUser })
        }

        return NextResponse.json({ authenticated: true, user: session.user })
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 })
    }
}
