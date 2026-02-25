"use client"

import { useLeaderCommunity } from "@/hooks/use-leader-community"
import { Card, CardContent } from "@/components/ui/card"
import { Target, TrendingUp, Users } from "lucide-react"

export default function LeaderLeadsPage() {
  const { community, members, loading } = useLeaderCommunity()

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
        <h1 className="text-2xl font-bold text-foreground">Leads</h1>
        <p className="text-sm text-muted-foreground">Resumen de leads generados por tu equipo en {community?.nombre || "tu comunidad"}</p>
      </div>

      <div className="grid gap-4 grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Target className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">0</p>
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
              <p className="text-2xl font-bold text-foreground">0</p>
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
              <p className="text-xs text-muted-foreground">Miembros</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardContent className="py-16 text-center">
          <Target className="mx-auto h-12 w-12 text-muted-foreground/15" />
          <p className="mt-4 text-sm font-medium text-foreground">Los leads de tu equipo apareceran aqui</p>
          <p className="mt-1.5 text-xs text-muted-foreground">Cuando tus miembros empiecen a captar leads con sus embudos, podras ver el resumen aqui.</p>
        </CardContent>
      </Card>
    </div>
  )
}
