import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"

function resolveUsername(session: NonNullable<Awaited<ReturnType<typeof getSession>>>): string | null {
  const s = session.user
  // Prefer explicit username; fall back to memberId (which may be an email)
  return s.username || s.memberId || null
}

export async function GET() {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const username = resolveUsername(session)
    if (!username) return NextResponse.json({ error: "Usuario sin identificador" }, { status: 400 })

    const db = createAdminClient()
    if (!db) return NextResponse.json({ error: "DB no configurada" }, { status: 503 })

    const { data, error } = await db
      .from("community_members")
      .select("whatsapp_number, whatsapp_message")
      .eq("username", username)
      .maybeSingle()

    if (error) throw error

    return NextResponse.json({
      success: true,
      whatsapp_number: data?.whatsapp_number ?? null,
      whatsapp_message: data?.whatsapp_message ?? null,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await getSession()
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const username = resolveUsername(session)
    if (!username) return NextResponse.json({ error: "Usuario sin identificador" }, { status: 400 })

    const { whatsapp_number, whatsapp_message } = await req.json()

    // Sanitize: only digits allowed for number
    const cleanNumber = (whatsapp_number ?? "").replace(/[^0-9]/g, "")

    // Validate: must be between 7 and 15 digits (international format)
    if (cleanNumber.length < 7 || cleanNumber.length > 15) {
      return NextResponse.json(
        { error: "Número inválido. Debe tener entre 7 y 15 dígitos con código de país." },
        { status: 422 }
      )
    }

    const db = createAdminClient()
    if (!db) return NextResponse.json({ error: "DB no configurada" }, { status: 503 })

    const { error } = await db
      .from("community_members")
      .update({
        whatsapp_number: cleanNumber,
        whatsapp_message: whatsapp_message ?? null,
      })
      .eq("username", username)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
