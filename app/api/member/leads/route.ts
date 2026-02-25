import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const email = searchParams.get("email")

        if (!email) {
            return NextResponse.json({ error: "Email requerido" }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Get member community_id
        const { data: member, error: memberError } = await supabase
            .from("community_members")
            .select("community_id, role")
            .eq("email", email)
            .maybeSingle()

        if (memberError || !member) {
            // If member not found in DB yet, return empty list instead of error to avoid UI crash
            return NextResponse.json([])
        }

        // 2. Fetch leads for this community
        // If leader, see all. If member, maybe only yours? 
        // For now, let's show all leads of the community to both leaders and members (as per standard MLM CRM)
        const { data: leads, error: leadsError } = await supabase
            .from("leads")
            .select("*")
            .eq("community_id", member.community_id)
            .order("created_at", { ascending: false })

        if (leadsError) {
            console.error("Leads fetch error:", leadsError)
            return NextResponse.json({ error: "Error al cargar leads" }, { status: 500 })
        }

        return NextResponse.json(leads)
    } catch (err) {
        console.error("Member leads API error:", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}

export async function PATCH(req: NextRequest) {
    try {
        const body = await req.json()
        const { lead_id, etapa } = body

        if (!lead_id || !etapa) {
            return NextResponse.json({ error: "Datos faltantes" }, { status: 400 })
        }

        const supabase = await createClient()

        const { error } = await supabase
            .from("leads")
            .update({ etapa })
            .eq("id", lead_id)

        if (error) {
            console.error("Lead update error:", error)
            return NextResponse.json({ error: "Error al actualizar lead" }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (err) {
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
