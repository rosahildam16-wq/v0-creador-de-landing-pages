import { NextResponse } from "next/server"

// Meta Marketing API endpoint
// Docs: https://developers.facebook.com/docs/marketing-api/insights
// Required env vars:
//   META_ACCESS_TOKEN  – Long-lived user or system-user token with ads_read scope
//   META_AD_ACCOUNT_ID – Format: act_XXXXXXXXX

const META_API_VERSION = "v19.0"
const BASE_URL = `https://graph.facebook.com/${META_API_VERSION}`

interface MetaCampaignInsight {
  campaign_id: string
  campaign_name: string
  spend: string
  impressions: string
  clicks: string
  actions?: Array<{ action_type: string; value: string }>
  cost_per_action_type?: Array<{ action_type: string; value: string }>
  cpc: string
  cpm: string
  ctr: string
  date_start: string
  date_stop: string
}

interface MetaInsightsResponse {
  data: MetaCampaignInsight[]
  paging?: { cursors: { before: string; after: string }; next?: string }
}

// GET /api/meta-ads?date_preset=last_30d
// GET /api/meta-ads?since=2026-01-01&until=2026-02-15
export async function GET(request: Request) {
  const token = process.env.META_ACCESS_TOKEN
  const accountId = process.env.META_AD_ACCOUNT_ID

  // If credentials are missing, return clearly labeled demo data
  if (!token || !accountId) {
    return NextResponse.json({
      mode: "demo",
      message: "META_ACCESS_TOKEN y META_AD_ACCOUNT_ID no configurados. Mostrando datos de demo.",
      data: generateDemoData(),
    })
  }

  // Real Meta API call
  try {
    const { searchParams } = new URL(request.url)
    const datePreset = searchParams.get("date_preset") || "last_30d"
    const since = searchParams.get("since")
    const until = searchParams.get("until")

    let dateParam = `date_preset=${datePreset}`
    if (since && until) {
      dateParam = `time_range={'since':'${since}','until':'${until}'}`
    }

    const fields = [
      "campaign_id",
      "campaign_name",
      "spend",
      "impressions",
      "clicks",
      "actions",
      "cost_per_action_type",
      "cpc",
      "cpm",
      "ctr",
    ].join(",")

    // Fetch campaign-level insights
    const insightsUrl = `${BASE_URL}/${accountId}/insights?fields=${fields}&${dateParam}&level=campaign&limit=50&access_token=${token}`
    const insightsRes = await fetch(insightsUrl, { next: { revalidate: 300 } })

    if (!insightsRes.ok) {
      const error = await insightsRes.json()
      return NextResponse.json(
        { mode: "error", message: error.error?.message || "Error al consultar Meta API", data: generateDemoData() },
        { status: insightsRes.status }
      )
    }

    const insights: MetaInsightsResponse = await insightsRes.json()

    // Also fetch daily breakdown for the chart
    const dailyUrl = `${BASE_URL}/${accountId}/insights?fields=spend,impressions,clicks,actions&${dateParam}&time_increment=1&limit=90&access_token=${token}`
    const dailyRes = await fetch(dailyUrl, { next: { revalidate: 300 } })
    const dailyData = dailyRes.ok ? await dailyRes.json() : { data: [] }

    // Transform data
    const campaigns = insights.data.map((c) => {
      const leads = c.actions?.find((a) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped")
      const costPerLead = c.cost_per_action_type?.find((a) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped")

      return {
        id: c.campaign_id,
        nombre: c.campaign_name,
        gasto: parseFloat(c.spend),
        impresiones: parseInt(c.impressions),
        clics: parseInt(c.clicks),
        leads: leads ? parseInt(leads.value) : 0,
        cpl: costPerLead ? parseFloat(costPerLead.value) : parseFloat(c.spend) > 0 && leads ? parseFloat(c.spend) / parseInt(leads.value) : 0,
        cpc: parseFloat(c.cpc || "0"),
        cpm: parseFloat(c.cpm || "0"),
        ctr: parseFloat(c.ctr || "0"),
        fecha_inicio: c.date_start,
        fecha_fin: c.date_stop,
      }
    })

    const daily = dailyData.data.map((d: MetaCampaignInsight) => {
      const leads = d.actions?.find((a: { action_type: string; value: string }) => a.action_type === "lead" || a.action_type === "onsite_conversion.lead_grouped")
      return {
        fecha: d.date_start,
        gasto: parseFloat(d.spend),
        impresiones: parseInt(d.impressions),
        clics: parseInt(d.clicks),
        leads: leads ? parseInt(leads.value) : 0,
      }
    })

    // Totals
    const totalGasto = campaigns.reduce((s, c) => s + c.gasto, 0)
    const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0)
    const totalClics = campaigns.reduce((s, c) => s + c.clics, 0)
    const totalImpresiones = campaigns.reduce((s, c) => s + c.impresiones, 0)

    return NextResponse.json({
      mode: "live",
      message: "Datos en tiempo real desde Meta Ads",
      data: {
        resumen: {
          gasto_total: Math.round(totalGasto * 100) / 100,
          leads_totales: totalLeads,
          cpl_promedio: totalLeads > 0 ? Math.round((totalGasto / totalLeads) * 100) / 100 : 0,
          clics_totales: totalClics,
          impresiones_totales: totalImpresiones,
          ctr_promedio: totalImpresiones > 0 ? Math.round((totalClics / totalImpresiones) * 10000) / 100 : 0,
        },
        campanas: campaigns,
        diario: daily,
      },
    })
  } catch (err) {
    return NextResponse.json(
      { mode: "error", message: `Error de conexion: ${err instanceof Error ? err.message : "desconocido"}`, data: generateDemoData() },
      { status: 500 }
    )
  }
}

// Demo data that mirrors the real API shape exactly
function generateDemoData() {
  const campaigns = [
    {
      id: "camp_001",
      nombre: "Nomada VIP - Frio - Video Hook",
      gasto: 1240.50,
      impresiones: 89420,
      clics: 3210,
      leads: 142,
      cpl: 8.74,
      cpc: 0.39,
      cpm: 13.87,
      ctr: 3.59,
      fecha_inicio: "2026-01-17",
      fecha_fin: "2026-02-15",
    },
    {
      id: "camp_002",
      nombre: "Nomada VIP - Retargeting Quiz",
      gasto: 680.25,
      impresiones: 32150,
      clics: 1890,
      leads: 89,
      cpl: 7.64,
      cpc: 0.36,
      cpm: 21.16,
      ctr: 5.88,
      fecha_inicio: "2026-01-17",
      fecha_fin: "2026-02-15",
    },
    {
      id: "camp_003",
      nombre: "Nomada VIP - Lookalike 1%",
      gasto: 950.00,
      impresiones: 67200,
      clics: 2450,
      leads: 67,
      cpl: 14.18,
      cpc: 0.39,
      cpm: 14.14,
      ctr: 3.65,
      fecha_inicio: "2026-01-20",
      fecha_fin: "2026-02-15",
    },
    {
      id: "camp_004",
      nombre: "Nomada VIP - Stories Testimonios",
      gasto: 420.75,
      impresiones: 41300,
      clics: 1650,
      leads: 52,
      cpl: 8.09,
      cpc: 0.26,
      cpm: 10.19,
      ctr: 3.99,
      fecha_inicio: "2026-01-25",
      fecha_fin: "2026-02-15",
    },
    {
      id: "camp_005",
      nombre: "Nomada VIP - Reels UGC",
      gasto: 310.00,
      impresiones: 55800,
      clics: 2100,
      leads: 38,
      cpl: 8.16,
      cpc: 0.15,
      cpm: 5.56,
      ctr: 3.76,
      fecha_inicio: "2026-02-01",
      fecha_fin: "2026-02-15",
    },
  ]

  // Generate 30 days of daily data
  const diario = []
  const baseDate = new Date(2026, 0, 17)
  for (let i = 0; i < 30; i++) {
    const date = new Date(baseDate.getTime() + i * 86400000)
    const dayVariance = 0.7 + Math.sin(i * 0.5) * 0.3 + (Math.sin(i * 1.7) * 0.15)
    const gasto = Math.round((95 + Math.sin(i * 0.8) * 35) * dayVariance * 100) / 100
    const leads = Math.max(1, Math.round((12 + Math.sin(i * 0.6) * 5) * dayVariance))
    diario.push({
      fecha: date.toISOString().split("T")[0],
      gasto,
      impresiones: Math.round((8500 + Math.sin(i * 0.4) * 2500) * dayVariance),
      clics: Math.round((350 + Math.sin(i * 0.7) * 120) * dayVariance),
      leads,
    })
  }

  const totalGasto = campaigns.reduce((s, c) => s + c.gasto, 0)
  const totalLeads = campaigns.reduce((s, c) => s + c.leads, 0)
  const totalClics = campaigns.reduce((s, c) => s + c.clics, 0)
  const totalImpresiones = campaigns.reduce((s, c) => s + c.impresiones, 0)

  return {
    resumen: {
      gasto_total: Math.round(totalGasto * 100) / 100,
      leads_totales: totalLeads,
      cpl_promedio: Math.round((totalGasto / totalLeads) * 100) / 100,
      clics_totales: totalClics,
      impresiones_totales: totalImpresiones,
      ctr_promedio: Math.round((totalClics / totalImpresiones) * 10000) / 100,
    },
    campanas: campaigns,
    diario,
  }
}
