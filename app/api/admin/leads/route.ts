import { NextResponse } from "next/server"
import { getLeads, getLeadById } from "@/lib/data"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (id) {
      const lead = await getLeadById(id)
      if (!lead) {
        return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 })
      }
      return NextResponse.json(lead)
    }

    const leads = await getLeads()
    return NextResponse.json(leads)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    console.error("Leads API error:", message)
    return NextResponse.json(
      { error: "Error cargando leads. Es posible que las tablas no existan aun." },
      { status: 500 }
    )
  }
}
