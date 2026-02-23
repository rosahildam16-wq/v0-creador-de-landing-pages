"use client"

import { useAuth } from "@/lib/auth-context"
import { getCommunityById, getCommunityMembers } from "@/lib/communities-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Kanban, UserPlus, MessageCircle, PhoneCall, CheckCircle } from "lucide-react"

const PIPELINE_STAGES = [
  { id: "nuevo", label: "Nuevo Contacto", icon: UserPlus, color: "#6366f1" },
  { id: "seguimiento", label: "En Seguimiento", icon: MessageCircle, color: "#f59e0b" },
  { id: "llamada", label: "Llamada Agendada", icon: PhoneCall, color: "#3b82f6" },
  { id: "cierre", label: "Cierre", icon: CheckCircle, color: "#10b981" },
]

export default function LeaderPipelinePage() {
  const { user } = useAuth()
  const community = user?.communityId ? getCommunityById(user.communityId) : undefined
  const members = user?.communityId ? getCommunityMembers(user.communityId) : []

  if (!community) return <p className="py-10 text-center text-muted-foreground">Comunidad no encontrada.</p>

  // Simulated pipeline distribution per stage
  const stageData = PIPELINE_STAGES.map((stage, i) => ({
    ...stage,
    count: Math.max(0, Math.floor(members.length * (4 - i) * 1.5 + Math.random() * 5)),
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Pipeline de {community.nombre}</h1>
        <p className="text-sm text-muted-foreground">Estado del pipeline de ventas de tu comunidad</p>
      </div>

      <div className="grid gap-4 grid-cols-4">
        {stageData.map((stage) => (
          <Card key={stage.id} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: `${stage.color}15` }}>
                  <stage.icon className="h-4 w-4" style={{ color: stage.color }} />
                </div>
                <CardTitle className="text-xs font-medium text-muted-foreground">{stage.label}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stage.count}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">prospectos en esta etapa</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <Kanban className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <p className="mt-3 text-sm text-muted-foreground">Pipeline detallado por miembro disponible proximamente.</p>
          <p className="mt-1 text-xs text-muted-foreground/60">Aqui podras ver el progreso de ventas de cada miembro de tu equipo.</p>
        </CardContent>
      </Card>
    </div>
  )
}
