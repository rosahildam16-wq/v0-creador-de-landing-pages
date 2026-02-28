import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const username = searchParams.get("username")
        const depth = searchParams.get("depth") || "1" // "1" or "2"

        if (!username) {
            return NextResponse.json({ error: "Username requerido" }, { status: 400 })
        }

        const supabase = await createClient()

        // Fetch Level 1 partners
        const { data: level1, error: err1 } = await supabase
            .from("community_members")
            .select("*")
            .eq("sponsor_username", username)
            .order("created_at", { ascending: false })

        if (err1) throw err1

        const mappedL1 = (level1 || []).map(p => ({
            id: p.member_id,
            nombre: p.name,
            username: p.username,
            email: p.email,
            avatar_initials: p.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "S",
            publicidad_activa: p.activo || false,
            fecha_renovacion: p.trial_ends_at ? new Date(p.trial_ends_at).toLocaleDateString() : null,
            metricas: { leads: 0, cerrados: 0, afiliados: 0 },
            progreso_academia: 0,
            sponsorId: p.sponsor_username,
            fecha_ingreso: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : "",
            level: 1
        }))

        if (depth === "1") {
            return NextResponse.json(mappedL1)
        }

        // Fetch Level 2 partners
        const l1Usernames = mappedL1.map(p => p.username).filter(Boolean)

        let mappedL2: any[] = []
        if (l1Usernames.length > 0) {
            const { data: level2, error: err2 } = await supabase
                .from("community_members")
                .select("*")
                .in("sponsor_username", l1Usernames)
                .order("created_at", { ascending: false })

            if (err2) throw err2

            mappedL2 = (level2 || []).map(p => ({
                id: p.member_id,
                nombre: p.name,
                username: p.username,
                email: p.email,
                avatar_initials: p.name?.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "S",
                publicidad_activa: p.activo || false,
                fecha_renovacion: p.trial_ends_at ? new Date(p.trial_ends_at).toLocaleDateString() : null,
                metricas: { leads: 0, cerrados: 0, afiliados: 0 },
                progreso_academia: 0,
                sponsorId: p.sponsor_username,
                fecha_ingreso: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : "",
                level: 2
            }))
        }

        return NextResponse.json({
            level1: mappedL1,
            level2: mappedL2
        })
    } catch (err) {
        console.error("Member partners API error:", err)
        return NextResponse.json({ error: "Error interno" }, { status: 500 })
    }
}
