import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth/session"
import { cookies } from "next/headers"

export async function POST(req: NextRequest) {
    try {
        const session = (await cookies()).get("session")?.value
        if (!session) return NextResponse.json({ error: "No session" }, { status: 401 })

        const user = await decrypt(session)
        if (!user) return NextResponse.json({ error: "Invalid user" }, { status: 401 })

        const body = await req.json()
        const { leadId, title, description, startTime, endTime, provider } = body

        if (!leadId || !startTime) {
            return NextResponse.json({ error: "Missing data" }, { status: 400 })
        }

        const supabase = await createClient()

        // 1. Get user member record
        const { data: member } = await supabase
            .from("community_members")
            .select("username")
            .eq("email", user.email)
            .maybeSingle()

        const username = member?.username || user.email

        // 2. Insert appointment
        const { error } = await supabase
            .from("appointments")
            .insert({
                member_id: username,
                lead_id: leadId,
                title,
                description,
                start_time: startTime,
                end_time: endTime,
                provider: provider || "manual",
                status: "confirmed"
            })

        if (error) {
            console.error("Appointment error:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // 3. Update lead stage to 'llamada_agendada'
        await supabase
            .from("leads")
            .update({ etapa: "llamada_agendada" })
            .eq("id", leadId)

        return NextResponse.json({ success: true })
    } catch (err) {
        console.error("Appointment API error:", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
