import { NextResponse } from "next/server"
import { registrarEvento } from "@/lib/data"

// POST /api/tracking
// Tracks funnel step completions.
// Body: { lead_id?: string, step: number, step_name: string }

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { lead_id, step, step_name } = body

    if (!step || !step_name) {
      return NextResponse.json({ success: false, error: "step and step_name required" }, { status: 400 })
    }

    // If we have a lead_id, register the tracking event
    if (lead_id) {
      await registrarEvento(lead_id, "funnel_step", `Completo paso ${step}: ${step_name}`)
    }

    return NextResponse.json({ success: true, step, step_name })
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    )
  }
}
