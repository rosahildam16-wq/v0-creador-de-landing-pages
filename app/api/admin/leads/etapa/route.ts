import { NextResponse } from "next/server"
import { updateLeadEtapa } from "@/lib/data"
import type { EtapaPipeline } from "@/lib/types"

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { lead_id, etapa } = body as { lead_id: string; etapa: EtapaPipeline }

    if (!lead_id || !etapa) {
      return NextResponse.json({ error: "lead_id y etapa son obligatorios" }, { status: 400 })
    }

    const success = await updateLeadEtapa(lead_id, etapa)
    if (!success) {
      return NextResponse.json({ error: "Error actualizando etapa" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Etapa API error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
