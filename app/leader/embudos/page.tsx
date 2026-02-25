"use client"

import { useLeaderCommunity } from "@/hooks/use-leader-community"
import { EMBUDOS } from "@/lib/embudos-config"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Route, Check, Eye, Users } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function LeaderEmbudosPage() {
  const { community, members, loading } = useLeaderCommunity()
  const [selectedFunnels, setSelectedFunnels] = useState<string[]>([])
  const [saved, setSaved] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  const toggle = (funnelId: string) => {
    setSelectedFunnels((prev) =>
      prev.includes(funnelId) ? prev.filter((f) => f !== funnelId) : [...prev, funnelId]
    )
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Embudos</h1>
          <p className="text-sm text-muted-foreground">Selecciona los embudos disponibles para tu equipo</p>
        </div>
        <Button onClick={handleSave} className={cn("gap-1.5", saved && "bg-emerald-600 hover:bg-emerald-600")}>
          {saved ? <Check className="h-4 w-4" /> : <Route className="h-4 w-4" />}
          {saved ? "Guardado" : "Guardar Cambios"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {EMBUDOS.map((embudo) => {
          const isActive = selectedFunnels.includes(embudo.id)
          return (
            <Card
              key={embudo.id}
              className={cn(
                "cursor-pointer transition-all border-border/50",
                isActive ? "border-primary/30 shadow-md shadow-primary/5" : "hover:border-border"
              )}
              onClick={() => toggle(embudo.id)}
            >
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="h-3 w-3 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: embudo.color }} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{embudo.nombre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{embudo.descripcion}</p>
                    </div>
                  </div>
                  <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0", isActive ? "border-primary bg-primary" : "border-border/50")}>
                    {isActive && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">{embudo.pasos.length} pasos</span>
                  {isActive && (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Activo</span>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Info card */}
      <Card className="border-border/50">
        <CardContent className="p-5 flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 shrink-0">
            <Users className="h-5 w-5 text-violet-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Los embudos activos estaran disponibles para tus {members.length} miembros</p>
            <p className="text-xs text-muted-foreground mt-0.5">Cada miembro podra usar los embudos que selecciones aqui para captar leads y hacer seguimiento.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
