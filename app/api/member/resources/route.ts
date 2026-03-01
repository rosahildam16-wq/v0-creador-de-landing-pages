import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

export async function GET() {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const communityId = session.user.communityId || "general"
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("community_resources")
            .select("*")
            .eq("community_id", communityId)
            .order("created_at", { ascending: false })

        if (error) throw error

        return NextResponse.json({ success: true, resources: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        // 🚨 Authorization: Only leaders or super_admins can upload/modify
        const isAuthorized = session.user.role === "leader" || session.user.role === "super_admin"
        if (!isAuthorized) {
            return NextResponse.json({ error: "No tienes permisos para subir recursos. Solo los creadores pueden hacerlo." }, { status: 403 })
        }

        const body = await req.json()
        const communityId = session.user.communityId || body.communityId || "general"
        const supabase = await createClient()

        const { data, error } = await supabase
            .from("community_resources")
            .upsert({
                id: body.id, // optional for update
                community_id: communityId,
                name: body.name,
                type: body.type,
                file_url: body.file_url,
                thumbnail_url: body.thumbnail_url,
                description: body.description,
                category: body.category || "General",
                created_by: session.user.memberId || session.user.email,
                updated_at: new Date().toISOString()
            })
            .select()
            .single()

        if (error) throw error

        return NextResponse.json({ success: true, resource: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getSession()
        const { searchParams } = new URL(req.url)
        const id = searchParams.get("id")

        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const isAuthorized = session.user.role === "leader" || session.user.role === "super_admin"
        if (!isAuthorized) {
            return NextResponse.json({ error: "No autorizado" }, { status: 403 })
        }

        const supabase = await createClient()
        const { error } = await supabase
            .from("community_resources")
            .delete()
            .eq("id", id)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
