import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = await createClient()

  // Get all communities
  const { data: communities } = await supabase
    .from("communities")
    .select("*")
    .eq("activa", true)
    .order("created_at", { ascending: false })

  // Get all members with their join date
  const { data: members } = await supabase
    .from("community_members")
    .select("*")
    .order("created_at", { ascending: false })

  const allMembers = members || []
  const allCommunities = communities || []

  // Total stats
  const totalMembers = allMembers.length
  const activeMembers = allMembers.filter((m) => m.activo).length
  const cuotaBase = 17 // USD por miembro
  const mrrEstimado = activeMembers * cuotaBase

  // Members registered today
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const membersToday = allMembers.filter(
    (m) => new Date(m.created_at) >= today
  ).length

  // Members this week
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const membersThisWeek = allMembers.filter(
    (m) => new Date(m.created_at) >= weekAgo
  ).length

  // Growth: last 30 days, day by day
  const growth: { fecha: string; miembros: number }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dayStr = d.toLocaleDateString("es-CO", { day: "2-digit", month: "short" })
    const dayEnd = new Date(d)
    dayEnd.setHours(23, 59, 59, 999)
    const cumulative = allMembers.filter(
      (m) => new Date(m.created_at) <= dayEnd
    ).length
    growth.push({ fecha: dayStr, miembros: cumulative })
  }

  // Per-community stats
  const communityStats = allCommunities.map((c) => {
    const communityMembers = allMembers.filter((m) => m.community_id === c.id)
    const active = communityMembers.filter((m) => m.activo).length
    const cuota = c.cuota_miembro || cuotaBase
    return {
      id: c.id,
      nombre: c.nombre,
      color: c.color,
      codigo: c.codigo,
      leader_name: c.leader_name,
      leader_email: c.leader_email,
      cuota_miembro: cuota,
      total_miembros: communityMembers.length,
      activos: active,
      mrr: active * cuota,
      miembros_recientes: communityMembers.slice(0, 5).map((m) => ({
        name: m.name,
        email: m.email,
        created_at: m.created_at,
        activo: m.activo,
      })),
    }
  })

  // Recent registrations (last 10)
  const recentRegistrations = allMembers.slice(0, 10).map((m) => ({
    name: m.name,
    email: m.email,
    community_id: m.community_id,
    discount_code: m.discount_code,
    sponsor_name: m.sponsor_name || null,
    created_at: m.created_at,
    activo: m.activo,
  }))

  return NextResponse.json({
    totalMembers,
    activeMembers,
    membersToday,
    membersThisWeek,
    mrrEstimado,
    cuotaBase,
    growth,
    communityStats,
    recentRegistrations,
  })
}
