import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth/session"
import { getIntegration, deleteIntegration } from "@/lib/integrations-db"

const ZOOM_AUTH_URL = "https://zoom.us/oauth/authorize"

function getRedirectUri() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${base}/api/integrations/zoom/callback`
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const memberId = session.user.memberId || session.user.email

  if (action === "status") {
    const integration = await getIntegration(memberId, "zoom")
    if (integration) {
      return NextResponse.json({
        connected: true,
        email: integration.email || "Cuenta conectada",
      })
    }
    return NextResponse.json({ connected: false })
  }

  // Generate OAuth URL
  if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Variables de entorno de Zoom no configuradas." },
      { status: 500 }
    )
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.ZOOM_CLIENT_ID,
    redirect_uri: getRedirectUri(),
    state: memberId, // Security & identification
  })

  const url = `${ZOOM_AUTH_URL}?${params.toString()}`
  return NextResponse.json({ url })
}

export async function DELETE() {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const memberId = session.user.memberId || session.user.email
  await deleteIntegration(memberId, "zoom")
  return NextResponse.json({ success: true })
}
