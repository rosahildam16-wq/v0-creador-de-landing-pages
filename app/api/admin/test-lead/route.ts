import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * GET /api/admin/test-lead
 * Diagnoses exactly which columns work in the leads table.
 */
export async function GET() {
    try {
        const supabase = createAdminClient()
        if (!supabase) {
            return NextResponse.json({ error: "No Supabase client" }, { status: 500 })
        }

        const results: Record<string, any> = {}

        // Test 1: Minimal insert (only basic columns)
        const minimalData = {
            nombre: "TEST-MIN",
            email: "min@test.com",
            telefono: "+0000000000",
            whatsapp: "+0000000000",
            fuente: "Organico",
            asignado_a: "sensei",
        }

        const { data: d1, error: e1 } = await supabase
            .from("leads")
            .insert(minimalData)
            .select()
            .single()

        if (e1) {
            results.minimal = { error: e1.message, code: e1.code }
        } else {
            results.minimal = { success: true, columns: Object.keys(d1 || {}) }
            // Clean up
            if (d1?.id) await supabase.from("leads").delete().eq("id", d1.id)
        }

        // Test 2: With pais
        const { error: e2 } = await supabase
            .from("leads")
            .insert({ ...minimalData, email: "t2@test.com", pais: "Colombia" })
            .select()
            .single()
            .then(r => {
                if (r.data?.id) supabase.from("leads").delete().eq("id", r.data.id)
                return r
            })
        results.with_pais = e2 ? { error: e2.message } : "✅ OK"

        // Test 3: With trafico
        const { error: e3 } = await supabase
            .from("leads")
            .insert({ ...minimalData, email: "t3@test.com", trafico: "Organico" })
            .select()
            .single()
            .then(r => {
                if (r.data?.id) supabase.from("leads").delete().eq("id", r.data.id)
                return r
            })
        results.with_trafico = e3 ? { error: e3.message } : "✅ OK"

        // Test 4: With embudo_id
        const { error: e4 } = await supabase
            .from("leads")
            .insert({ ...minimalData, email: "t4@test.com", embudo_id: "franquicia-reset" })
            .select()
            .single()
            .then(r => {
                if (r.data?.id) supabase.from("leads").delete().eq("id", r.data.id)
                return r
            })
        results.with_embudo_id = e4 ? { error: e4.message } : "✅ OK"

        return NextResponse.json({
            message: "Diagnóstico de columnas de la tabla leads",
            results,
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
