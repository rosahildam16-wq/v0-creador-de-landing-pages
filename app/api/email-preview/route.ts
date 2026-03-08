import { NextRequest, NextResponse } from "next/server"
import { render } from "@react-email/render"
import React from "react"
import { SkaliaWelcomeEmail } from "@/components/emails/skalia-welcome"
import { WelcomeEmail } from "@/components/emails/welcome-email"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get("type") || "skalia"
  const name = searchParams.get("name") || "María García"
  const code = searchParams.get("code") || "DIAMANTECELION"
  const base = process.env.NEXT_PUBLIC_BASE_URL || "https://magicfunnel.app"
  const dashboardUrl = `${base}/login`

  const element =
    type === "skalia"
      ? React.createElement(SkaliaWelcomeEmail, { name, dashboardUrl })
      : React.createElement(WelcomeEmail, { name, communityCode: code, dashboardUrl })

  const html = await render(element)

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
