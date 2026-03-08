import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 503 })

        const { data, error } = await supabase
            .from("community_members")
            .select("name, email, avatar_url, member_id")
            .eq("email", session.user.email)
            .maybeSingle()

        if (error) throw error

        return NextResponse.json({ success: true, profile: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const body = await req.json()
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "DB no disponible" }, { status: 503 })

        const updates: Record<string, any> = {}
        if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url || null
        if (body.name !== undefined && body.name.trim()) updates.name = body.name.trim()

        if (Object.keys(updates).length === 0) {
            return NextResponse.json({ error: "Sin cambios" }, { status: 400 })
        }

        const { data, error } = await supabase
            .from("community_members")
            .update(updates)
            .eq("email", session.user.email)
            .select("name, email, avatar_url, member_id")
            .maybeSingle()

        if (error) throw error

        return NextResponse.json({ success: true, profile: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
