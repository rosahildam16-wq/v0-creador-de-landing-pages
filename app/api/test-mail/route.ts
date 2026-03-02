import { NextResponse } from "next/server"
import { sendWelcomeEmail } from "@/lib/email-service"

export async function GET() {
    try {
        const result = await sendWelcomeEmail({
            email: "skmetdo@gmail.com",
            name: "Socio de Prueba",
            communityCode: "RESET-TEST"
        })

        return NextResponse.json({
            message: "Test email triggered",
            result
        })
    } catch (err) {
        return NextResponse.json({
            error: err instanceof Error ? err.message : "Unknown error"
        }, { status: 500 })
    }
}
