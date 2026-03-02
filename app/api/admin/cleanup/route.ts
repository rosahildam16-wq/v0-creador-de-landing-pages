import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/admin/cleanup?confirm=yes
 * Removes ALL leads and related data from the database.
 * Requires confirm=yes to prevent accidental deletion.
 */
export async function GET(req: NextRequest) {
    const confirm = req.nextUrl.searchParams.get("confirm")

    if (confirm !== "yes") {
        return NextResponse.json({
            warning: "Esto eliminará TODOS los leads de la base de datos. Agrega ?confirm=yes a la URL para confirmar.",
        })
    }

    try {
        const supabase = createAdminClient()
        if (!supabase) {
            return NextResponse.json({ error: "No DB connection" }, { status: 500 })
        }

        const results: Record<string, any> = {}

        // 1. Count leads before deletion
        const { count: totalLeads } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
        results.leads_before = totalLeads || 0

        // 2. Delete all related data first (foreign keys)
        // Notes
        const { error: notasErr } = await supabase
            .from("notas")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all
        results.notas = notasErr ? `Error: ${notasErr.message}` : "✅ Eliminadas"

        // Activities
        const { error: actErr } = await supabase
            .from("eventos_actividad")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000")
        results.actividades = actErr ? `Error: ${actErr.message}` : "✅ Eliminadas"

        // Lead insights
        try {
            await supabase
                .from("lead_insights")
                .delete()
                .neq("id", "00000000-0000-0000-0000-000000000000")
            results.insights = "✅ Eliminados"
        } catch {
            results.insights = "Tabla no existe (ok)"
        }

        // Sequence enrollments
        try {
            await supabase
                .from("sequence_enrollments")
                .delete()
                .neq("id", "00000000-0000-0000-0000-000000000000")
            results.enrollments = "✅ Eliminados"
        } catch {
            results.enrollments = "Tabla no existe (ok)"
        }

        // 3. Delete ALL leads
        const { error: leadsErr } = await supabase
            .from("leads")
            .delete()
            .neq("id", "00000000-0000-0000-0000-000000000000") // Delete all
        results.leads = leadsErr ? `Error: ${leadsErr.message}` : "✅ Eliminados"

        // 4. Verify
        const { count: remaining } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
        results.leads_remaining = remaining || 0

        return NextResponse.json({
            success: true,
            message: `✅ Limpieza completa. ${totalLeads || 0} leads eliminados. Base de datos limpia y lista para producción.`,
            details: results,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
