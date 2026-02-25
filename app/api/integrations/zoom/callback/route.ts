import { NextResponse } from "next/server"
import { setZoomTokens } from "@/lib/integrations-store"

function getRedirectUri() {
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${base}/api/integrations/zoom/callback`
}

// GET /api/integrations/zoom/callback — OAuth2 callback
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")

  if (error) {
    return NextResponse.redirect(
      new URL("/admin/integraciones?zoom=error&reason=" + encodeURIComponent(error), request.url)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL("/admin/integraciones?zoom=error&reason=no_code", request.url)
    )
  }

  try {
    const clientId = process.env.ZOOM_CLIENT_ID!
    const clientSecret = process.env.ZOOM_CLIENT_SECRET!
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

    // Exchange code for tokens
    const tokenRes = await fetch("https://zoom.us/oauth/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: getRedirectUri(),
      }),
    })

    if (!tokenRes.ok) {
      const errData = await tokenRes.text()
      console.error("Zoom token exchange error:", errData)
      return NextResponse.redirect(
        new URL("/admin/integraciones?zoom=error&reason=token_exchange_failed", request.url)
      )
    }

    const tokens = await tokenRes.json()

    // Get user info
    const userRes = await fetch("https://api.zoom.us/v2/users/me", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    })

    let email = ""
    if (userRes.ok) {
      const userData = await userRes.json()
      email = userData.email || ""
    }

    // Store tokens
    setZoomTokens({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expiry_date: Date.now() + tokens.expires_in * 1000,
      email,
    })

    return NextResponse.redirect(
      new URL("/admin/integraciones?zoom=success&email=" + encodeURIComponent(email), request.url)
    )
  } catch (err) {
    console.error("Zoom OAuth callback error:", err)
    return NextResponse.redirect(
      new URL("/admin/integraciones?zoom=error&reason=unknown", request.url)
    )
  }
}
