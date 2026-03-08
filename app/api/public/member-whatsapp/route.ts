import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

// Public endpoint: anyone can read a member's WhatsApp config by username/slug.
// Used by the Reset funnel landing page to show the correct WhatsApp button for
// the referring member.

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const slug = searchParams.get("slug")

        if (!slug) return NextResponse.json({ error: "slug requerido" }, { status: 400 })

        const supabase = await createClient()
        const { data, error } = await supabase
            .from("community_members")
            .select("whatsapp_number, whatsapp_message")
            .eq("username", slug)
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
