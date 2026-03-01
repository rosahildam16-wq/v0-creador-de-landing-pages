import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { TEAM_MEMBERS } from "@/lib/team-data"
import { getLeaderCommunity } from "@/lib/communities-data"

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json()
        const normalizedEmail = email.toLowerCase().trim()

        const ADMIN_EMAIL = (process.env.NEXT_PUBLIC_SUPER_ADMIN_EMAIL || "iajorgeleon21@gmail.com").trim().toLowerCase()
        const ADMIN_PASSWORD = "Leon321$#"
        const MEMBER_DEFAULT_PASSWORD = "Member123$"
        const LAUNCH_TEST_CODE = "LANZAMIENTO2026"

        let userData = null

        // 1. Check Super Admin
        if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
            userData = { email: ADMIN_EMAIL, name: "Jorge Leon", role: "super_admin" }
        }

        // 2. Member Test Shortcut
        if (!userData && normalizedEmail === "test_member@magic.com" && password === "test1234") {
            userData = { email: normalizedEmail, name: "Miembro de Prueba", role: "member", communityId: "general" }
        }

        // 3. Launch Test Code
        if (!userData && password === LAUNCH_TEST_CODE) {
            const existingMember = TEAM_MEMBERS.find((m) => m.email.toLowerCase() === normalizedEmail)
            const nameFromEmail = normalizedEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())
            const memberId = existingMember?.id || `test-${normalizedEmail.replace(/[^a-z0-9]/g, "")}`
            const leaderComm = getLeaderCommunity(normalizedEmail)

            userData = {
                email: normalizedEmail,
                name: existingMember?.nombre || nameFromEmail,
                role: "member",
                memberId,
                username: memberId,
                communityId: leaderComm?.id,
            }
        }

        // 4. Team Members (Static)
        if (!userData) {
            const teamMember = TEAM_MEMBERS.find((m) => m.email.toLowerCase() === normalizedEmail)
            if (teamMember && password === MEMBER_DEFAULT_PASSWORD) {
                userData = {
                    email: teamMember.email,
                    name: teamMember.nombre,
                    role: "member",
                    memberId: teamMember.id,
                    username: teamMember.id,
                }
            }
        }

        // 5. Database Users
        if (!userData) {
            const supabase = await createClient()
            const { data: member } = await supabase
                .from("community_members")
                .select("member_id, name, username, community_id, role, email")
                .or(`email.eq."${normalizedEmail}",username.eq."${normalizedEmail}"`)
                .maybeSingle()

            if (member) {
                // Fetch subscription
                const { data: sub } = await supabase
                    .from("subscriptions")
                    .select("plan_id")
                    .eq("user_email", member.email.toLowerCase())
                    .in("status", ["trial", "active"])
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle()

                userData = {
                    email: member.email,
                    name: member.name,
                    username: member.username,
                    role: member.role || "member",
                    memberId: member.member_id,
                    communityId: member.community_id,
                    planId: sub?.plan_id || "basico" // Fallback to basico
                }
            }
        }

        if (!userData) {
            return NextResponse.json({ success: false }, { status: 401 })
        }

        // Shield Phase 2: Create secure session cookie
        const { createSession } = await import("@/lib/auth/session")
        await createSession(userData)

        return NextResponse.json({ success: true, ...userData })
    } catch (err) {
        console.error("Shield Login Error:", err)
        return NextResponse.json({ error: "Internal Error" }, { status: 500 })
    }
}
