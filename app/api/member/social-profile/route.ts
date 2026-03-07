import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

export async function GET() {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const username = session.user.username || session.user.memberId

        const supabase = await createClient()
        const { data, error } = await supabase
            .from("social_centers")
            .select("*")
            .eq("username", username)
            .maybeSingle()

        if (error) {
            if (error.message?.includes("schema cache") || error.code === "42P01" || error.message?.includes("does not exist")) {
                await triggerMigration()
                return NextResponse.json({ success: true, profile: null })
            }
            throw error
        }

        return NextResponse.json({ success: true, profile: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const username = session.user.username || session.user.memberId
        const body = await req.json()

        const supabase = await createClient()
        const { data, error } = await supabase
            .from("social_centers")
            .upsert({
                username: username,
                display_name: body.display_name,
                tagline: body.tagline || null,
                bio: body.bio,
                avatar_url: body.avatar_url || null,
                theme_config: body.theme_config,
                links: body.links,
                social_links: body.social_links,
                updated_at: new Date().toISOString()
            }, { onConflict: "username" })
            .select()
            .single()

        if (error) {
            if (error.message?.includes("schema cache") || error.code === "42P01" || error.message?.includes("does not exist") || error.message?.includes("column")) {
                await triggerMigration()
                return NextResponse.json({ error: "Tablas actualizadas, intenta de nuevo en 15 segundos." }, { status: 503 })
            }
            throw error
        }

        return NextResponse.json({ success: true, profile: data })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

async function triggerMigration() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        await fetch(`${baseUrl}/api/admin/migrate-forms`, { method: "POST" })
    } catch {}
}
