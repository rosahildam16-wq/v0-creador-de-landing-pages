import { NextResponse } from "next/server"
import { addNota } from "@/lib/data"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lead_id, texto, autor } = body

    if (!lead_id || !texto) {
      return NextResponse.json({ error: "lead_id y texto son obligatorios" }, { status: 400 })
    }

    const nota = await addNota(lead_id, texto, autor || "Tu")
    if (!nota) {
      return NextResponse.json({ error: "Error guardando nota" }, { status: 500 })
    }

    return NextResponse.json(nota)
  } catch (error) {
    console.error("Notas API error:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
