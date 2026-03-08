import { NextRequest, NextResponse } from "next/server"
import { requireAdminSession } from "@/lib/server/admin-guard"
import {
  getMetricas,
  getLeadsPorDia,
  getLeadsPorFuente,
  getDistribucionTemperatura,
  getLeads,
  getActividad,
} from "@/lib/data"

export const dynamic = "force-dynamic"

// All admin roles may view the dashboard
export async function GET(request: NextRequest) {
  const guard = await requireAdminSession(request)
  if (!guard.ok) return guard.response

  try {

    const [metricas, leadsPorDia, leadsPorFuente, distribucionTemp, leads, actividad] =
      await Promise.all([
        getMetricas(),
        getLeadsPorDia(),
        getLeadsPorFuente(),
        getDistribucionTemperatura(),
        getLeads(),
        getActividad(8),
      ])


    return NextResponse.json({
      metricas,
      leadsPorDia,
      leadsPorFuente,
      distribucionTemp,
      leads,
      actividad,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido"
    console.error("Dashboard API error:", message)

    return NextResponse.json(
      { error: "Error cargando datos del dashboard.", details: message },
      { status: 500 }
    )
  }
}
