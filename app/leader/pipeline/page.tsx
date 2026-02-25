"use client"

import { useLeaderCommunity } from "@/hooks/use-leader-community"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Kanban, UserPlus, MessageCircle, PhoneCall, CheckCircle } from "lucide-react"

const PIPELINE_STAGES = [
  { id: "nuevo", label: "Nuevo Contacto", icon: UserPlus, color: "#6366f1" },
  { id: "seguimiento", label: "En Seguimiento", icon: MessageCircle, color: "#f59e0b" },
  { id: "llamada", label: "Llamada Agendada", icon: PhoneCall, color: "#3b82f6" },
  { id: "cierre", label: "Cierre", icon: CheckCircle, color: "#10b981" },
]

export default function LeaderPipelinePage() {
  const { community, loading } = useLeaderCommunity()

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
        <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
        <p className="text-sm text-muted-foreground">Estado del pipeline de ventas de {community?.nombre || "tu comunidad"}</p>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {PIPELINE_STAGES.map((stage) => (
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
              <p className="text-3xl font-bold text-foreground">0</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">prospectos en esta etapa</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50">
        <CardContent className="py-16 text-center">
          <Kanban className="mx-auto h-12 w-12 text-muted-foreground/15" />
          <p className="mt-4 text-sm font-medium text-foreground">El pipeline detallado por miembro estara disponible aqui</p>
          <p className="mt-1.5 text-xs text-muted-foreground">Podras ver el progreso de ventas de cada miembro de tu equipo.</p>
        </CardContent>
      </Card>
    </div>
  )
}
