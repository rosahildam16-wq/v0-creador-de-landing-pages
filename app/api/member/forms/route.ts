import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { decrypt } from "@/lib/auth/session"
import { generateFormId, slugify } from "@/lib/form-types"

async function getUser() {
    const session = (await cookies()).get("mf_session")?.value
    if (!session) return null
    const payload = await decrypt(session)
    return payload?.user || null
}

/**
 * GET /api/member/forms — list all forms for the authenticated user
 */
export async function GET() {
    try {
        const user = await getUser()
        if (!user) return NextResponse.json({ error: "No session" }, { status: 401 })

        const supabase = await createClient()
        const { data, error } = await supabase
            .from("forms")
            .select("id, name, slug, description, status, mode, views, starts, completions, created_at, updated_at")
            .eq("owner_email", user.email)
            .order("updated_at", { ascending: false })

        if (error) {
            // If forms table doesn't exist, trigger auto-migration
            if (error.message?.includes("schema cache") || error.code === "42P01" || error.message?.includes("does not exist")) {
                await triggerFormsMigration()
                return NextResponse.json({ forms: [], migration: "triggered" })
            }
            throw error
        }

        return NextResponse.json({ forms: data || [] })
    } catch (err: any) {
        if (err?.message?.includes("schema cache") || err?.code === "42P01" || err?.message?.includes("does not exist")) {
            await triggerFormsMigration()
            return NextResponse.json({ forms: [], migration: "triggered" })
        }
        return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
    }
}

async function triggerFormsMigration() {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        await fetch(`${baseUrl}/api/admin/migrate-forms`, { method: "POST" })
    } catch (e) {
        console.error("[forms] Auto-migration failed:", e)
    }
}

/**
 * POST /api/member/forms — create a new form
 */
export async function POST(req: NextRequest) {
    try {
        const user = await getUser()
        if (!user) return NextResponse.json({ error: "No session" }, { status: 401 })

        const body = await req.json()
        const { name, description, mode } = body

        if (!name) return NextResponse.json({ error: "name es requerido" }, { status: 400 })

        const supabase = await createClient()

        // Generate unique slug
        const baseSlug = slugify(name)
        const { data: existing } = await supabase
            .from("forms")
            .select("id")
            .eq("slug", baseSlug)
            .maybeSingle()

        const finalSlug = existing ? `${baseSlug}-${Date.now().toString(36)}` : baseSlug

        const id = generateFormId()
        const { data, error } = await supabase
            .from("forms")
            .insert({
                id,
                owner_email: user.email,
                name,
                slug: finalSlug,
                description: description || null,
                mode: mode || "conversational",
                status: "draft",
                welcome_screen: {
                    title: `Bienvenido a ${name}`,
                    subtitle: "Completa este formulario. Solo toma unos minutos.",
                    button_label: "Comenzar",
                },
                end_screen: {
                    title: "¡Gracias por tu respuesta!",
                    subtitle: "Hemos recibido tu información. Te contactaremos pronto.",
                },
                design: {
                    primary_color: "#7c3aed",
                    bg_color: "#0f0a1a",
                    font: "sans",
                },
                settings: {
                    pipeline_stage: "lead_nuevo",
                    notify_email: true,
                },
            })
            .select()
            .single()

        if (error) {
            if (error.message?.includes("schema cache") || error.code === "42P01" || error.message?.includes("does not exist")) {
                await triggerFormsMigration()
                return NextResponse.json({ error: "Tables were just created, please try again in a moment." }, { status: 503 })
            }
            throw error
        }

        return NextResponse.json({ form: data }, { status: 201 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 })
    }
}
