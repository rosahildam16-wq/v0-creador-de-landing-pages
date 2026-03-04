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
        const email = (session.user as { email?: string }).email
        if (email) void bootstrapSuperAdmin(email)

        return NextResponse.json({ authenticated: true, user: session.user })
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 })
    }
}
