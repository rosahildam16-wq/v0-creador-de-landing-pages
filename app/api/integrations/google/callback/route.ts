import { NextResponse } from "next/server"
import { google } from "googleapis"
import { setGoogleTokens } from "@/lib/integrations-store"

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/integrations/google/callback`
  )
}

// GET /api/integrations/google/callback — OAuth2 callback
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    // User denied access or an error occurred
    return NextResponse.redirect(
      new URL("/admin/integraciones?google=error&reason=" + encodeURIComponent(error), request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/integraciones?google=error&reason=no_code", request.url)
    )
  }

  try {
    const oauth2Client = getOAuth2Client()
    const { tokens } = await oauth2Client.getToken(code)
    oauth2Client.setCredentials(tokens)

    // Get user email
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client })
    const userInfo = await oauth2.userinfo.get()
    const email = userInfo.data.email || ""

    // Store tokens
    setGoogleTokens({
      access_token: tokens.access_token || "",
      refresh_token: tokens.refresh_token || undefined,
      expiry_date: tokens.expiry_date || undefined,
      email,
    })

    return NextResponse.redirect(
      new URL("/admin/integraciones?google=success&email=" + encodeURIComponent(email), request.url)
    )
  } catch (err) {
    console.error("Google OAuth callback error:", err)
    return NextResponse.redirect(
      new URL("/admin/integraciones?google=error&reason=token_exchange_failed", request.url)
    )
  }
}
