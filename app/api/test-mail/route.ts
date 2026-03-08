import { NextRequest, NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email-service"
import { isResendConfigured } from "@/lib/resend"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "skalia"
    const to = searchParams.get("to") || "skmetdo@gmail.com"
    const name = searchParams.get("name") || "Socio de Prueba"

    if (!isResendConfigured()) {
        return NextResponse.json(
            {
                error: "Resend no configurado",
                result: {
                    success: false,
                    error: "RESEND_API_KEY no está configurada en este entorno. El email no fue enviado. En producción (Vercel) esta función sí está activa.",
                },
            },
            { status: 503 }
        )
    }

    try {
        const isSkalia = type === "skalia"
        const result = await sendWelcomeEmail({
            email: to,
            name,
            communityCode: isSkalia ? "DIAMANTECELION" : "MAGIC-TEST",
            communityId: isSkalia ? "skalia-vip" : "general",
        })

        return NextResponse.json({
            message: `Email de prueba (${type}) enviado a ${to}`,
            result,
        })
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Error desconocido" },
            { status: 500 }
        )
    }
}
