import { NextRequest, NextResponse } from "next/server"
import { loadMetaAdsConfig, getMetaInsights } from "@/lib/meta-client"

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const memberId = searchParams.get("memberId")
        const datePreset = searchParams.get("datePreset") || "last_30d"

        if (!memberId) {
            return NextResponse.json({ error: "Member ID required" }, { status: 400 })
        }

        // 1. Get Meta config by member
        const config = await loadMetaAdsConfig(memberId)

        if (!config) {
            return NextResponse.json({
                error: "Meta Ads no configurado para este usuario",
                configured: false
            }, { status: 200 }) // Return 200 with flag instead of error for UI
        }

        // 2. Fetch from Meta API
        const insights = await getMetaInsights(config, datePreset)

        return NextResponse.json({
            success: true,
            data: insights[0] || null, // Insights for the account level are usually at index 0
            configured: true
        })

    } catch (err: any) {
        console.error("Meta insights API error:", err)
        return NextResponse.json({
            error: err.message || "Error al cargar datos de Meta",
            configured: true
        }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const { memberId, adAccountId, accessToken, pixelId, pixelToken } = await req.json()

        if (!memberId || !adAccountId || !accessToken) {
            return NextResponse.json({ error: "Campos requeridos faltantes" }, { status: 400 })
        }

        const { saveMetaAdsConfig } = await import("@/lib/meta-client")
        await saveMetaAdsConfig(memberId, { adAccountId, accessToken, pixelId, pixelToken })

        return NextResponse.json({ success: true, message: "Configuracion de Meta Ads guardada" })
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
