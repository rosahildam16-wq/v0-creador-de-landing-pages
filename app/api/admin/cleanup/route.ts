import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * DELETE /api/admin/cleanup?member=sensei&confirm=yes
 * Removes all leads assigned to a specific member.
 * Requires confirm=yes to prevent accidental deletion.
 */
export async function DELETE(req: NextRequest) {
    const member = req.nextUrl.searchParams.get("member")
    const confirm = req.nextUrl.searchParams.get("confirm")

    if (!member) {
        return NextResponse.json({ error: "Parámetro 'member' requerido" }, { status: 400 })
    }

    if (confirm !== "yes") {
        return NextResponse.json({
            warning: `Esto eliminará TODOS los leads asignados a '${member}'. Agrega &confirm=yes a la URL para confirmar.`,
        })
    }

    try {
        const supabase = createAdminClient()
        if (!supabase) {
            return NextResponse.json({ error: "No DB connection" }, { status: 500 })
        }

        // First count how many leads will be deleted
        const { count } = await supabase
            .from("leads")
            .select("*", { count: "exact", head: true })
            .eq("asignado_a", member)

        // Delete all leads assigned to this member
        const { error } = await supabase
            .from("leads")
            .delete()
            .eq("asignado_a", member)

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({
            success: true,
            message: `✅ Se eliminaron ${count || 0} leads asignados a '${member}'.`,
            deleted_count: count || 0,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
