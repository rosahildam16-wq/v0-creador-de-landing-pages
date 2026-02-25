import { NextResponse } from "next/server"
import { google } from "googleapis"
import { getGoogleTokens, clearGoogleTokens } from "@/lib/integrations-store"

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/google/callback`
  )
}

// GET /api/integrations/google — get auth URL or check status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  if (action === "status") {
    const tokens = getGoogleTokens()
    if (tokens) {
      return NextResponse.json({
        connected: true,
        email: tokens.email || "Cuenta conectada",
      })
    }
    return NextResponse.json({ connected: false })
  }

  // Generate OAuth URL
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    return NextResponse.json(
      { error: "Variables GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET no configuradas. Agregalas en Vars." },
      { status: 500 }
    )
  }

  const oauth2Client = getOAuth2Client()
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
  })

  return NextResponse.json({ url: authUrl })
}

// DELETE /api/integrations/google — disconnect
export async function DELETE() {
  clearGoogleTokens()
  return NextResponse.json({ success: true })
}
