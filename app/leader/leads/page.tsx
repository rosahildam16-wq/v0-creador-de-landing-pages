"use client"

import { useAuth } from "@/lib/auth-context"
import { getCommunityById, getCommunityMembers } from "@/lib/communities-data"
import { Card, CardContent } from "@/components/ui/card"
import { Users, Target, TrendingUp } from "lucide-react"

export default function LeaderLeadsPage() {
  const { user } = useAuth()
  const community = user?.communityId ? getCommunityById(user.communityId) : undefined
  const members = user?.communityId ? getCommunityMembers(user.communityId) : []

  if (!community) return <p className="py-10 text-center text-muted-foreground">Comunidad no encontrada.</p>

  // Simulated lead data per community member
  const memberLeadData = members.map((m) => ({
    ...m,
    leads: Math.floor(Math.random() * 30) + 2,
    conversiones: Math.floor(Math.random() * 8),
    ultimaActividad: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
  }))

  const totalLeads = memberLeadData.reduce((sum, m) => sum + m.leads, 0)
  const totalConversiones = memberLeadData.reduce((sum, m) => sum + m.conversiones, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leads de {community.nombre}</h1>
        <p className="text-sm text-muted-foreground">Resumen de leads generados por tu equipo</p>
      </div>

      {/* Summary metrics */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalLeads}</p>
              <p className="text-xs text-muted-foreground">Leads totales</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalConversiones}</p>
              <p className="text-xs text-muted-foreground">Conversiones</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Users className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{members.length}</p>
              <p className="text-xs text-muted-foreground">Miembros activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member lead table */}
      {memberLeadData.length > 0 ? (
        <Card className="border-border/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-5 py-3 text-left text-xs font-medium text-muted-foreground">Miembro</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Leads</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Conversiones</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Tasa</th>
                    <th className="px-5 py-3 text-right text-xs font-medium text-muted-foreground">Ultima Actividad</th>
                  </tr>
                </thead>
                <tbody>
                  {memberLeadData.sort((a, b) => b.leads - a.leads).map((m) => (
                    <tr key={m.memberId} className="border-b border-border/20 last:border-0 hover:bg-secondary/30 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{m.name}</p>
                            <p className="text-[10px] text-muted-foreground">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-sm font-semibold text-foreground">{m.leads}</td>
                      <td className="px-5 py-3 text-right text-sm text-foreground">{m.conversiones}</td>
                      <td className="px-5 py-3 text-right text-sm text-muted-foreground">{m.leads > 0 ? ((m.conversiones / m.leads) * 100).toFixed(1) : 0}%</td>
                      <td className="px-5 py-3 text-right text-xs text-muted-foreground">
                        {new Date(m.ultimaActividad).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <Target className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-3 text-sm text-muted-foreground">No hay leads aun.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
