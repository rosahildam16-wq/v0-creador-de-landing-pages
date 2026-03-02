import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// GET - List sequences
export async function GET(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json([])

        const communityId = req.nextUrl.searchParams.get("communityId")

        let query = supabase
            .from("email_sequences")
            .select("*, email_sequence_steps(count)")
            .order("created_at", { ascending: false })

        if (communityId) {
            query = query.eq("community_id", communityId)
        }

        const { data, error } = await query
        if (error) {
            // Table might not exist yet
            if (error.code === "42P01") return NextResponse.json([])
            throw error
        }

        return NextResponse.json(data || [])
    } catch (err: any) {
        console.error("Sequences GET error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// POST - Create a new sequence
export async function POST(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const body = await req.json()
        const { nombre, descripcion, trigger_type, trigger_value, community_id, autor_id, autor_role, steps } = body

        // Create the sequence
        const { data: sequence, error: seqError } = await supabase
            .from("email_sequences")
            .insert({
                nombre,
                descripcion: descripcion || "",
                trigger_type: trigger_type || "manual",
                trigger_value: trigger_value || "",
                community_id: community_id || "general",
                autor_id: autor_id || "",
                autor_role: autor_role || "admin",
                estado: "borrador"
            })
            .select()
            .single()

        if (seqError) throw seqError

        // Create steps if provided
        if (steps && steps.length > 0 && sequence) {
            const stepsToInsert = steps.map((step: any, index: number) => ({
                sequence_id: sequence.id,
                step_order: index,
                asunto: step.asunto || "",
                contenido_html: step.contenido_html || "",
                delay_days: step.delay_days || 0,
                delay_hours: step.delay_hours || 0,
                condition_type: step.condition_type || "none",
                condition_value: step.condition_value || "",
                activo: true
            }))

            const { error: stepsError } = await supabase
                .from("email_sequence_steps")
                .insert(stepsToInsert)

            if (stepsError) {
                console.warn("Error inserting steps:", stepsError)
            }
        }

        return NextResponse.json({ success: true, sequence })
    } catch (err: any) {
        console.error("Sequences POST error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// PATCH - Update sequence (status, steps, etc.)
export async function PATCH(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const body = await req.json()
        const { id, estado, nombre, descripcion, trigger_type, trigger_value, steps } = body

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        // Update sequence metadata
        const updateData: any = { updated_at: new Date().toISOString() }
        if (estado) updateData.estado = estado
        if (nombre) updateData.nombre = nombre
        if (descripcion !== undefined) updateData.descripcion = descripcion
        if (trigger_type) updateData.trigger_type = trigger_type
        if (trigger_value !== undefined) updateData.trigger_value = trigger_value

        const { error: updateError } = await supabase
            .from("email_sequences")
            .update(updateData)
            .eq("id", id)

        if (updateError) throw updateError

        // Replace steps if provided
        if (steps) {
            // Delete old steps
            await supabase.from("email_sequence_steps").delete().eq("sequence_id", id)

            // Insert new steps
            if (steps.length > 0) {
                const stepsToInsert = steps.map((step: any, index: number) => ({
                    sequence_id: id,
                    step_order: index,
                    asunto: step.asunto || "",
                    contenido_html: step.contenido_html || "",
                    delay_days: step.delay_days || 0,
                    delay_hours: step.delay_hours || 0,
                    condition_type: step.condition_type || "none",
                    condition_value: step.condition_value || "",
                    activo: step.activo !== false
                }))

                await supabase.from("email_sequence_steps").insert(stepsToInsert)
            }
        }

        return NextResponse.json({ success: true })
    } catch (err: any) {
        console.error("Sequences PATCH error:", err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

// DELETE
export async function DELETE(req: NextRequest) {
    try {
        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No DB" }, { status: 500 })

        const id = req.nextUrl.searchParams.get("id")
        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

        const { error } = await supabase.from("email_sequences").delete().eq("id", id)
        if (error) throw error

        return NextResponse.json({ success: true })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
