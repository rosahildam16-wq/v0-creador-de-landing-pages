import { NextResponse } from "next/server"
import QRCode from "qrcode"
import {
  getWhatsAppSession,
  setWhatsAppSession,
  clearWhatsAppSession,
} from "@/lib/integrations-store"

// In production, this would be a reference to a whatsapp-web.js Client instance
// running in a separate persistent process or a microservice.
// whatsapp-web.js requires Puppeteer and a persistent Node.js process,
// which cannot run inside serverless functions.
//
// Architecture for production:
// 1. Run a separate Node.js server with whatsapp-web.js + express
// 2. That server exposes: GET /qr, GET /status, POST /send
// 3. These API routes proxy to that server
//
// For now, we connect to WHATSAPP_SERVER_URL if configured,
// otherwise return clear instructions.

function getServerUrl(): string | null {
  return process.env.WHATSAPP_SERVER_URL || null
}

// GET /api/integrations/whatsapp — get status or QR
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get("action")

  const serverUrl = getServerUrl()

  // Check connection status
  if (action === "status") {
    // Try to check with the WhatsApp server
    if (serverUrl) {
      try {
        const res = await fetch(`${serverUrl}/status`, { 
          signal: AbortSignal.timeout(5000) 
        })
        if (res.ok) {
          const data = await res.json()
          if (data.connected) {
            setWhatsAppSession({
              connected: true,
              phone: data.phone || data.number,
              lastSeen: Date.now(),
            })
          }
          return NextResponse.json(data)
        }
      } catch {
        // Server unreachable
      }
    }

    // Fallback to local store
    const session = getWhatsAppSession()
    if (session?.connected) {
      return NextResponse.json({
        connected: true,
        phone: session.phone,
      })
    }

    return NextResponse.json({
      connected: false,
      serverConfigured: !!serverUrl,
    })
  }

  // Generate QR code
  if (action === "qr") {
    if (serverUrl) {
      try {
        const res = await fetch(`${serverUrl}/qr`, {
          signal: AbortSignal.timeout(10000),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.qr) {
            // Convert QR string to data URL image
            const qrDataUrl = await QRCode.toDataURL(data.qr, {
              width: 300,
              margin: 2,
              color: { dark: "#000000", light: "#FFFFFF" },
            })
            return NextResponse.json({
              qr: qrDataUrl,
              status: "qr-ready",
            })
          }
          if (data.connected) {
            return NextResponse.json({
              status: "connected",
              phone: data.phone,
            })
          }
        }
      } catch {
        return NextResponse.json(
          { error: "No se pudo conectar al servidor de WhatsApp. Verifica que este corriendo." },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      {
        error: "Servidor de WhatsApp no configurado",
        help: "Necesitas un servidor Node.js corriendo whatsapp-web.js. Configura WHATSAPP_SERVER_URL en Vars.",
        setupGuide: {
          step1: "Clona el servidor: git clone https://github.com/nicecoder5/whatsapp-web-api-server",
          step2: "Instala dependencias: npm install whatsapp-web.js express qrcode cors",
          step3: "Ejecuta: node server.js",
          step4: "Agrega WHATSAPP_SERVER_URL=http://tu-servidor:3001 en Vars",
        },
      },
      { status: 400 }
    )
  }

  return NextResponse.json({ error: "Parametro action requerido: status | qr" }, { status: 400 })
}

// POST /api/integrations/whatsapp — send message
export async function POST(request: Request) {
  const serverUrl = getServerUrl()

  if (!serverUrl) {
    return NextResponse.json(
      { error: "Servidor de WhatsApp no configurado. Agrega WHATSAPP_SERVER_URL en Vars." },
      { status: 400 }
    )
  }

  try {
    const body = await request.json()
    const { number, message } = body

    if (!number || !message) {
      return NextResponse.json(
        { error: "Campos number y message son requeridos" },
        { status: 400 }
      )
    }

    // Forward to WhatsApp server
    const res = await fetch(`${serverUrl}/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number, message }),
      signal: AbortSignal.timeout(15000),
    })

    if (res.ok) {
      const data = await res.json()
      return NextResponse.json({ success: true, ...data })
    }

    const errData = await res.text()
    return NextResponse.json(
      { error: "Error al enviar mensaje", details: errData },
      { status: res.status }
    )
  } catch (err) {
    console.error("WhatsApp send error:", err)
    return NextResponse.json(
      { error: "No se pudo conectar al servidor de WhatsApp" },
      { status: 503 }
    )
  }
}

// DELETE /api/integrations/whatsapp — disconnect session
export async function DELETE() {
  const serverUrl = getServerUrl()

  if (serverUrl) {
    try {
      await fetch(`${serverUrl}/disconnect`, { 
        method: "POST",
        signal: AbortSignal.timeout(5000),
      })
    } catch {
      // Server may be down
    }
  }

  clearWhatsAppSession()
  return NextResponse.json({ success: true })
}
