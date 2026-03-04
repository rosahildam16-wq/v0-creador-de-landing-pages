import { getSession } from "@/lib/auth/session"
import { NextResponse } from "next/server"
import { bootstrapSuperAdmin } from "@/lib/server/bootstrap-admin"

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

        return NextResponse.json({ authenticated: true, user: session.user })
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 })
    }
}
