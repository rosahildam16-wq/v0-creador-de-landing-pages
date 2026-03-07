import { NextResponse } from "next/server"
import { google } from "googleapis"
import { getSession } from "@/lib/auth/session"
import { getIntegration, deleteIntegration } from "@/lib/integrations-db"

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/google/callback`
  )
}

export async function GET(request: Request) {
  const session = await getSession()
  if (!session?.user) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")
  const memberId = session.user.memberId || session.user.email

  if (action === "status") {
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json({ connected: false, error: "Variables de entorno de Google no configuradas." })
    }
    // Validate client ID format (should end with .apps.googleusercontent.com)
    if (!process.env.GOOGLE_CLIENT_ID.endsWith(".apps.googleusercontent.com")) {
      return NextResponse.json({ connected: false, error: "GOOGLE_CLIENT_ID no es válido. Debe terminar en .apps.googleusercontent.com. Verifica tu Google Cloud Console." })
    }
    const integration = await getIntegration(memberId, "google")
    if (integration) {
      return NextResponse.json({
        connected: true,
        email: integration.email || "Cuenta conectada",
      })
    }
    return NextResponse.json({ connected: false })
  }

  // Generate OAuth URL
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Variables de entorno de Google no configuradas." },
      { status: 500 }
    )
  }
  if (!process.env.GOOGLE_CLIENT_ID.endsWith(".apps.googleusercontent.com")) {
    return NextResponse.json(
      { error: "GOOGLE_CLIENT_ID no es válido. Verifica tu Google Cloud Console." },
      { status: 500 }
    )
  }

  const oauth2Client = getOAuth2Client()
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state: memberId, // Pass memberId to callback via state
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  })

  return NextResponse.json({ url: authUrl })
}

export async function DELETE() {
  const session = await getSession()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const memberId = session.user.memberId || session.user.email
  await deleteIntegration(memberId, "google")
  return NextResponse.json({ success: true })
}
