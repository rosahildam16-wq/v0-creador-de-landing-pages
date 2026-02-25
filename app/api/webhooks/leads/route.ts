import { NextRequest, NextResponse } from "next/server"
import { createLead, getLeads } from "@/lib/data"

// POST /api/webhooks/leads?token=SECURE_TOKEN
// Inbound webhook endpoint that receives leads from external funnels.

interface WebhookPayload {
  first_name: string
  last_name?: string
  email: string
  phone: string
  source?: string
  booking_date?: string
  booking_time?: string
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate token
    const { searchParams } = new URL(request.url)
    const token = searchParams.get("token")
    const secureToken = process.env.WEBHOOK_SECURE_TOKEN

    if (secureToken && token !== secureToken) {
      return NextResponse.json(
        { success: false, error: "Token invalido o ausente. Agrega ?token=TU_TOKEN a la URL." },
        { status: 401 }
      )
    }

    // 2. Parse and validate payload
    const body: WebhookPayload = await request.json()

    const errors: string[] = []
    if (!body.first_name || typeof body.first_name !== "string") {
      errors.push("first_name es obligatorio")
    }
    if (!body.email || typeof body.email !== "string") {
      errors.push("email es obligatorio")
    }
    if (!body.phone || typeof body.phone !== "string") {
      errors.push("phone es obligatorio")
    }

    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, error: "Validacion fallida", details: errors },
        { status: 400 }
      )
    }

    // 3. Create contact via data layer
    const phoneSanitized = body.phone.replace(/[^\d+]/g, "")
    const emailNormalized = body.email.trim().toLowerCase()
    const nombre = `${body.first_name} ${body.last_name || ""}`.trim()

    const lead = await createLead({
      nombre,
      email: emailNormalized,
      telefono: phoneSanitized,
      whatsapp: phoneSanitized,
      fuente: (body.source as "Meta Ads" | "Instagram" | "TikTok" | "Google" | "Organico") || "Organico",
    })

    if (!lead) {
      return NextResponse.json({ success: false, error: "Error creando contacto" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Contacto creado correctamente",
      data: {
        contact_id: lead.id,
        action: "created",
        contact: {
          nombre,
          email: emailNormalized,
          phone: phoneSanitized,
          source: body.source || "webhook-inbound",
        },
      },
    })
  } catch (err) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ success: false, error: "El body debe ser JSON valido" }, { status: 400 })
    }
    return NextResponse.json(
      { success: false, error: `Error del servidor: ${err instanceof Error ? err.message : "desconocido"}` },
      { status: 500 }
    )
  }
}

// GET /api/webhooks/leads?token=SECURE_TOKEN
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get("token")
  const secureToken = process.env.WEBHOOK_SECURE_TOKEN

  if (secureToken && token !== secureToken) {
    return NextResponse.json({ success: false, error: "Token invalido" }, { status: 401 })
  }

  const leads = await getLeads()

  return NextResponse.json({
    success: true,
    endpoint: "POST /api/webhooks/leads?token=SECURE_TOKEN",
    contacts_in_db: leads.length,
    payload_example: {
      first_name: "Juan",
      last_name: "Perez",
      email: "juan@mail.com",
      phone: "+573001112233",
      source: "embudo-nomadas",
    },
  })
}
