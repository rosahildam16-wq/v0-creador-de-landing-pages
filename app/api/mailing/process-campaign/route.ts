
import { createAdminClient } from "@/lib/supabase/admin"
import { sendCampaignEmail } from "@/lib/email-service"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
    try {
        const { campaignId } = await req.json()
        if (!campaignId) return NextResponse.json({ error: "Missing campaignId" }, { status: 400 })

        const supabase = createAdminClient()
        if (!supabase) return NextResponse.json({ error: "No client" }, { status: 500 })

        // 1. Fetch campaign
        const { data: campaign, error: campaignError } = await supabase
            .from("campanas_email")
            .select("*")
            .eq("id", campaignId)
            .single()

        if (campaignError || !campaign) {
            console.error("Error fetching campaign:", campaignError)
            return NextResponse.json({ error: "Campaign not found" }, { status: 404 })
        }

        if (campaign.estado === "enviada") {
            return NextResponse.json({ error: "Campaign already sent" }, { status: 400 })
        }

        // 2. Identify target leads
        let query = supabase.from("leads").select("id, email, nombre")

        switch (campaign.audiencia) {
            case "todos":
                // No filters
                break
            case "comunidad":
                if (campaign.community_id) {
                    query = query.eq("community_id", campaign.community_id)
                }
                break
            case "miembros_activos":
                query = query.eq("etapa", "cerrado")
                if (campaign.community_id) {
                    query = query.eq("community_id", campaign.community_id)
                }
                break
            case "leads_por_embudo":
                if (campaign.audience_filters?.funnel_id) {
                    query = query.eq("embudo_id", campaign.audience_filters.funnel_id)
                }
                break
            case "persona_especifica":
                if (campaign.audience_filters?.lead_ids && campaign.audience_filters.lead_ids.length > 0) {
                    query = query.in("id", campaign.audience_filters.lead_ids)
                } else {
                    return NextResponse.json({ error: "No individuals selected" }, { status: 400 })
                }
                break
            default:
                break
        }

        const { data: leads, error: leadsError } = await query

        if (leadsError) {
            console.error("Error fetching target leads:", leadsError)
            return NextResponse.json({ error: "Error fetching targets" }, { status: 500 })
        }

        if (!leads || leads.length === 0) {
            return NextResponse.json({ success: true, sent: 0, message: "No target leads found" })
        }

        // 3. Send emails
        console.log(`Enviando campaña ${campaign.titulo} a ${leads.length} leads...`)

        const results = await Promise.all(
            leads.map(lead =>
                sendCampaignEmail({
                    email: lead.email,
                    name: lead.nombre,
                    subject: campaign.asunto,
                    contentHtml: campaign.contenido_html
                })
            )
        )

        const successful = results.filter(r => r.success).length

        // 4. Update campaign status
        await supabase
            .from("campanas_email")
            .update({
                estado: "enviada",
                enviado_en: new Date().toISOString(),
                leads_alcanzados: successful
            })
            .eq("id", campaignId)

        return NextResponse.json({
            success: true,
            total: leads.length,
            sent: successful,
            failed: leads.length - successful
        })

    } catch (err) {
        console.error("Campaign process error:", err)
        return NextResponse.json({ error: "Internal error" }, { status: 500 })
    }
}
