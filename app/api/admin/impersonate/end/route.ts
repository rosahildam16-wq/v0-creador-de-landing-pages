import { NextRequest, NextResponse } from "next/server"
import { endImpersonation } from "@/lib/server/impersonation"

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/impersonate/end
 * Ends the current impersonation session and restores the admin's original session.
 */
export async function POST(request: NextRequest) {
  const ip        = request.headers.get("x-forwarded-for") ?? undefined
  const userAgent = request.headers.get("user-agent") ?? undefined

  const result = await endImpersonation(ip, userAgent)

  if (!result.ok) {
    return NextResponse.json(
      { error: "No hay sesión de impersonación activa" },
      { status: 400 }
    )
  }

  return NextResponse.json({ ok: true, redirectTo: result.redirectTo })
}
