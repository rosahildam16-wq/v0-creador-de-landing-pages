"use client"

import { useAuth } from "@/lib/auth-context"
import { getCommunityById, updateCommunity } from "@/lib/communities-data"
import { EMBUDOS } from "@/lib/embudos-config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Route, Check, Shield } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export default function LeaderEmbudosPage() {
  const { user } = useAuth()
  const community = user?.communityId ? getCommunityById(user.communityId) : undefined
  const [selectedFunnels, setSelectedFunnels] = useState<string[]>(community?.embudos_default || [])
  const [saved, setSaved] = useState(false)

  if (!community) return <p className="py-10 text-center text-muted-foreground">Comunidad no encontrada.</p>

  const toggle = (funnelId: string) => {
    setSelectedFunnels((prev) =>
      prev.includes(funnelId) ? prev.filter((f) => f !== funnelId) : [...prev, funnelId]
    )
  }

  const handleSave = () => {
    updateCommunity(community.id, { embudos_default: selectedFunnels })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Embudos de {community.nombre}</h1>
          <p className="text-sm text-muted-foreground">Selecciona los embudos que se habilitan por defecto para nuevos miembros</p>
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
                    <div className="h-3 w-3 rounded-full mt-1" style={{ backgroundColor: embudo.color }} />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{embudo.nombre}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{embudo.descripcion}</p>
                    </div>
                  </div>
                  <div className={cn("h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all", isActive ? "border-primary bg-primary" : "border-border/50")}>
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
    </div>
  )
}
