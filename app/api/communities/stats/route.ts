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
  const now = new Date()
  const totalMembers = allMembers.length
  const activeMembers = allMembers.filter((m) => m.activo).length
  const cuotaBase = 17 // USD por miembro

  // Members in free trial (trial_ends_at in the future)
  const membersInTrial = allMembers.filter(
    (m) => m.trial_ends_at && new Date(m.trial_ends_at) > now
  ).length
  const membersTrialExpired = allMembers.filter(
    (m) => m.trial_ends_at && new Date(m.trial_ends_at) <= now
  ).length

  // MRR: only count active members NOT in trial
  const payingMembers = allMembers.filter(
    (m) => m.activo && (!m.trial_ends_at || new Date(m.trial_ends_at) <= now)
  ).length
  const mrrEstimado = payingMembers * cuotaBase

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
    const inTrial = communityMembers.filter(
      (m) => m.trial_ends_at && new Date(m.trial_ends_at) > now
    ).length
    const paying = communityMembers.filter(
      (m) => m.activo && (!m.trial_ends_at || new Date(m.trial_ends_at) <= now)
    ).length
    const cuota = c.cuota_miembro || cuotaBase
    return {
      id: c.id,
      nombre: c.nombre,
      color: c.color,
      codigo: c.codigo,
      leader_name: c.leader_name,
      leader_email: c.leader_email,
      cuota_miembro: cuota,
      free_trial_days: c.free_trial_days || 0,
      total_miembros: communityMembers.length,
      activos: active,
      en_trial: inTrial,
      pagando: paying,
      mrr: paying * cuota,
      miembros_recientes: communityMembers.slice(0, 5).map((m) => ({
        name: m.name,
        email: m.email,
        created_at: m.created_at,
        activo: m.activo,
        trial_ends_at: m.trial_ends_at,
      })),
    }
  })

  // Recent registrations (last 10)
  const recentRegistrations = allMembers.slice(0, 10).map((m) => {
    const inTrialNow = m.trial_ends_at && new Date(m.trial_ends_at) > now
    const trialExpired = m.trial_ends_at && new Date(m.trial_ends_at) <= now
    return {
      name: m.name,
      email: m.email,
      community_id: m.community_id,
      discount_code: m.discount_code,
      sponsor_name: m.sponsor_name || null,
      trial_ends_at: m.trial_ends_at,
      trial_status: inTrialNow ? "trial" : trialExpired ? "expired" : "none",
      created_at: m.created_at,
      activo: m.activo,
    }
  })

  return NextResponse.json({
    totalMembers,
    activeMembers,
    payingMembers,
    membersInTrial,
    membersTrialExpired,
    membersToday,
    membersThisWeek,
    mrrEstimado,
    cuotaBase,
    growth,
    communityStats,
    recentRegistrations,
  })
}
