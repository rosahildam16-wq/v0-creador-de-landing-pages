import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * DELETE /api/admin/cleanup?member=sensei&confirm=yes
 * Complete cleanup: removes leads, notes, activities, and insights for a member.
 */
export async function DELETE(req: NextRequest) {
    const member = req.nextUrl.searchParams.get("member")
    const confirm = req.nextUrl.searchParams.get("confirm")

    if (!member) {
        return NextResponse.json({ error: "Parámetro 'member' requerido" }, { status: 400 })
    }

    if (confirm !== "yes") {
        return NextResponse.json({
            warning: `Esto eliminará TODOS los leads y datos relacionados de '${member}'. Agrega &confirm=yes para confirmar.`,
        })
    }

    try {
        const supabase = createAdminClient()
        if (!supabase) {
            return NextResponse.json({ error: "No DB connection" }, { status: 500 })
        }

        const results: Record<string, any> = {}

        // 1. Get all lead IDs for this member first
        const { data: leads } = await supabase
            .from("leads")
            .select("id")
            .eq("asignado_a", member)

        const leadIds = leads?.map((l: any) => l.id) || []
        results.leads_found = leadIds.length

        if (leadIds.length > 0) {
            // 2. Delete related notes
            const { error: notasError } = await supabase
                .from("notas")
                .delete()
                .in("lead_id", leadIds)
            results.notas = notasError ? `Error: ${notasError.message}` : "✅ Limpias"

            // 3. Delete related activities
            const { error: actividadError } = await supabase
                .from("eventos_actividad")
                .delete()
                .in("lead_id", leadIds)
            results.actividades = actividadError ? `Error: ${actividadError.message}` : "✅ Limpias"

            // 4. Delete lead insights
            try {
                const { error: insightsError } = await supabase
                    .from("lead_insights")
                    .delete()
                    .in("lead_id", leadIds)
                results.insights = insightsError ? `Error: ${insightsError.message}` : "✅ Limpios"
            } catch {
                results.insights = "Tabla no existe (ok)"
            }

            // 5. Delete sequence enrollments
            try {
                const { error: enrollError } = await supabase
                    .from("sequence_enrollments")
                    .delete()
                    .in("lead_id", leadIds)
                results.enrollments = enrollError ? `Error: ${enrollError.message}` : "✅ Limpios"
            } catch {
                results.enrollments = "Tabla no existe (ok)"
            }
        }

        // 6. Finally delete the leads themselves
        const { error: leadsError } = await supabase
            .from("leads")
            .delete()
            .eq("asignado_a", member)
        results.leads = leadsError ? `Error: ${leadsError.message}` : "✅ Eliminados"

        // 7. Also clean "Sin asignar" test leads if requested
        if (member === "sensei") {
            // Count Sin asignar leads too
            const { count: sinAsignar } = await supabase
                .from("leads")
                .select("*", { count: "exact", head: true })
                .eq("asignado_a", "Sin asignar")
            results.sin_asignar_count = sinAsignar || 0
        }

        return NextResponse.json({
            success: true,
            message: `✅ Limpieza completa para '${member}'. ${leadIds.length} leads eliminados con todos sus datos relacionados.`,
            details: results,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
