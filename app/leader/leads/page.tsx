"use client"

import { useState, useEffect } from "react"
import { useLeaderCommunity } from "@/hooks/use-leader-community"
import { Card, CardContent } from "@/components/ui/card"
import { Target, TrendingUp, Users, AtSign, Calendar } from "lucide-react"

interface TeamLead {
  id: string
  nombre: string
  email: string
  whatsapp: string | null
  etapa: string
  fuente: string
  fecha_ingreso: string
  asignado_a: string
  asignado_nombre: string
  es_downline: boolean
}

interface TeamLeadsStats {
  total: number
  conversiones: number
  downlineLeads: number
  directLeads: number
  referralCount: number
}

const ETAPA_LABEL: Record<string, string> = {
  lead_nuevo: "Nuevo",
  contactado: "Contactado",
  presentado: "Presentado",
  cerrado: "Cerrado",
  perdido: "Perdido",
}

const ETAPA_COLOR: Record<string, string> = {
  lead_nuevo: "bg-sky-500/10 text-sky-400",
  contactado: "bg-amber-500/10 text-amber-400",
  presentado: "bg-violet-500/10 text-violet-400",
  cerrado: "bg-emerald-500/10 text-emerald-400",
  perdido: "bg-zinc-500/10 text-zinc-400",
}

export default function LeaderLeadsPage() {
  const { user } = useLeaderCommunity()
  const [leads, setLeads] = useState<TeamLead[]>([])
  const [stats, setStats] = useState<TeamLeadsStats>({
    total: 0,
    conversiones: 0,
    downlineLeads: 0,
    directLeads: 0,
    referralCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) {
      setLoading(false)
      return
    }

    const fetchTeamLeads = async () => {
      try {
        const res = await fetch(`/api/leader/team-leads?email=${encodeURIComponent(user.email)}`)
        if (res.ok) {
          const data = await res.json()
          setLeads(data.leads || [])
          setStats(data.stats || {})
        }
      } catch {
        // silently fail
      } finally {
        setLoading(false)
      }
    }

    fetchTeamLeads()
  }, [user?.email])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Leads de tu equipo</h1>
        <p className="text-sm text-muted-foreground">
          Leads generados por ti y por tus socios directos
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
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
              <p className="text-2xl font-bold text-foreground">{stats.conversiones}</p>
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
              <p className="text-2xl font-bold text-foreground">{stats.downlineLeads}</p>
              <p className="text-xs text-muted-foreground">De tu red</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Leads list */}
      {leads.length > 0 ? (
        <div className="space-y-2">
          {leads.map((lead) => (
            <Card key={lead.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{lead.nombre}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${ETAPA_COLOR[lead.etapa] || "bg-zinc-500/10 text-zinc-400"}`}>
                        {ETAPA_LABEL[lead.etapa] || lead.etapa}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{lead.email}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <AtSign className="h-2.5 w-2.5" />
                        {lead.asignado_nombre}
                        {lead.es_downline && (
                          <span className="ml-1 text-primary/60">(socio)</span>
                        )}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-muted-foreground/60">
                        <Calendar className="h-2.5 w-2.5" />
                        {new Date(lead.fecha_ingreso).toLocaleDateString("es-ES", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <Target className="mx-auto h-12 w-12 text-muted-foreground/15" />
            <p className="mt-4 text-sm font-medium text-foreground">
              Aun no hay leads en tu equipo
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              Cuando tu o tus socios empiecen a captar leads con sus embudos, apareceran aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
