import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/admin/test-lead
 * Creates a test lead to verify the database is working.
 */
export async function GET() {
    try {
        const supabase = createAdminClient()
        if (!supabase) {
            return NextResponse.json({ error: "No Supabase client" }, { status: 500 })
        }

        // 1. Check if leads table is accessible
        const { data: existing, error: readErr } = await supabase
            .from("leads")
            .select("id")
            .limit(1)

        if (readErr) {
            return NextResponse.json({
                step: "READ",
                error: readErr.message,
                code: readErr.code,
            })
        }

        // 2. Try to insert a test lead
        const { data: newLead, error: insertErr } = await supabase
            .from("leads")
            .insert({
                nombre: "TEST-DIAGNOSTICO",
                email: "test@diagnostico.com",
                telefono: "+0000000000",
                whatsapp: "+0000000000",
                fuente: "Organico",
                asignado_a: "sensei",
                embudo_id: "franquicia-reset",
                pais: "Test",
                trafico: "Organico",
            })
            .select()
            .single()

        if (insertErr) {
            return NextResponse.json({
                step: "INSERT",
                error: insertErr.message,
                code: insertErr.code,
                hint: insertErr.hint,
                details: insertErr.details,
            })
        }

        // 3. Clean up test lead
        if (newLead?.id) {
            await supabase.from("leads").delete().eq("id", newLead.id)
        }

        return NextResponse.json({
            success: true,
            message: "✅ La tabla leads funciona correctamente. Lectura e inserción OK.",
            test_lead_created: !!newLead,
            existing_count: existing?.length || 0,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
