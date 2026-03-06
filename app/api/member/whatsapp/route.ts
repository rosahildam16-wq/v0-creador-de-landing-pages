import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

export async function GET() {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const username = session.user.username || session.user.memberId
        if (!username) return NextResponse.json({ error: "Usuario sin username" }, { status: 400 })

        const supabase = await createClient()
        const { data, error } = await supabase
            .from("community_members")
            .select("whatsapp_number, whatsapp_message")
            .eq("username", username)
            .maybeSingle()

        if (error) throw error

        return NextResponse.json({
            success: true,
            whatsapp_number: data?.whatsapp_number ?? null,
            whatsapp_message: data?.whatsapp_message ?? null,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getSession()
        if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

        const username = session.user.username || session.user.memberId
        if (!username) return NextResponse.json({ error: "Usuario sin username" }, { status: 400 })

        const { whatsapp_number, whatsapp_message } = await req.json()

        // Sanitize: only digits allowed for number
        const cleanNumber = (whatsapp_number ?? "").replace(/[^0-9]/g, "")

        const supabase = await createClient()
        const { error } = await supabase
            .from("community_members")
            .update({ whatsapp_number: cleanNumber, whatsapp_message: whatsapp_message ?? null })
            .eq("username", username)

        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
