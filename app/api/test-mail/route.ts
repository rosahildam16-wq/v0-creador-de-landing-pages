import { NextRequest, NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email-service"

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "skalia"
    const to = searchParams.get("to") || "skmetdo@gmail.com"
    const name = searchParams.get("name") || "Socio de Prueba"

    try {
        const isSkalia = type === "skalia"
        const result = await sendWelcomeEmail({
            email: to,
            name,
            communityCode: isSkalia ? "DIAMANTECELION" : "MAGIC-TEST",
            communityId: isSkalia ? "skalia-vip" : "general",
        })

        return NextResponse.json({
            message: `Test email (${type}) sent to ${to}`,
            result,
        })
    } catch (err) {
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Unknown error" },
            { status: 500 }
        )
    }
}
