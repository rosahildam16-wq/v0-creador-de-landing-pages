import { createAdminClient } from "@/lib/supabase/admin"
import { sendWelcomeEmail } from "@/lib/email-service"
import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession, requireRole } from "@/lib/server/admin-guard"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
    // Require super_admin or admin session
    const guard = await requireAdminSession(req)
    if (!guard.ok) return guard.response
    const roleCheck = requireRole(guard.user.role, ["super_admin", "admin"])
    if (!roleCheck.ok) return roleCheck.response

    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No client" }, { status: 500 })

        // Get members with DIAMANTECELION code
        const { data: members, error } = await supabase
            .from("community_members")
            .select("email, name, discount_code")
            .eq("discount_code", "DIAMANTECELION")

        if (error) {
            console.error("Error fetching Skalia members:", error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        if (!members || members.length === 0) {
            return NextResponse.json({
                success: true,
                sent: 0,
                message: "No se encontraron miembros con el código DIAMANTECELION en la base de datos."
            })
        }

        console.log(`Enviando bienvenida Skalia a ${members.length} socios...`)

        const results = await Promise.all(
            members.map(m =>
                sendWelcomeEmail({
                    email: m.email,
                    name: m.name,
                    communityCode: "DIAMANTECELION"
                })
            )
        )

        const successful = results.filter(r => r.success).length

        return NextResponse.json({
            success: true,
            total: members.length,
            sent: successful,
            failed: members.length - successful
        })
    } catch (err) {
        console.error("Mass email error:", err)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}
