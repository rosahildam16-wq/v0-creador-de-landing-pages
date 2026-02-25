import { NextResponse } from "next/server"
import { getZoomTokens, clearZoomTokens } from "@/lib/integrations-store"

const ZOOM_AUTH_URL = "https://zoom.us/oauth/authorize"

function getRedirectUri() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${base}/api/integrations/zoom/callback`
}

// GET /api/integrations/zoom — get auth URL or check status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  if (action === "status") {
    const tokens = getZoomTokens()
    if (tokens) {
      return NextResponse.json({
        connected: true,
        email: tokens.email || "Cuenta conectada",
      })
    }
    return NextResponse.json({ connected: false })
  }

  // Generate OAuth URL
  if (!process.env.ZOOM_CLIENT_ID || !process.env.ZOOM_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Variables ZOOM_CLIENT_ID y ZOOM_CLIENT_SECRET no configuradas. Agregalas en Vars." },
      { status: 500 }
    )
  }

  const params = new URLSearchParams({
    response_type: "code",
    client_id: process.env.ZOOM_CLIENT_ID,
    redirect_uri: getRedirectUri(),
  })

  const url = `${ZOOM_AUTH_URL}?${params.toString()}`
  return NextResponse.json({ url })
}

// DELETE /api/integrations/zoom — disconnect
export async function DELETE() {
  clearZoomTokens()
  return NextResponse.json({ success: true })
}
