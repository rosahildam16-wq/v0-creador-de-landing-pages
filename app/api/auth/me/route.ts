import { getSession } from "@/lib/auth/session"
import { NextResponse } from "next/server"

export async function GET() {
    try {
        const session = await getSession()
        if (!session || !session.user) {
            return NextResponse.json({ authenticated: false }, { status: 401 })
        }
        return NextResponse.json({ authenticated: true, user: session.user })
    } catch {
        return NextResponse.json({ authenticated: false }, { status: 401 })
    }
}
