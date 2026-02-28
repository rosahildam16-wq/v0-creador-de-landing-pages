import { NextResponse } from "next/server"
import { askMagicAI } from "@/lib/ai-service"

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json()

        if (!message) {
            return NextResponse.json({ error: "No message provided" }, { status: 400 })
        }

        const response = await askMagicAI(message, history || [])

        return NextResponse.json({ response })
    } catch (err) {
        console.error("API Chat Error:", err)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
