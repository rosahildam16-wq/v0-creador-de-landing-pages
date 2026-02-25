"use client"

import { useLeaderCommunity } from "@/hooks/use-leader-community"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, DollarSign, Users, TrendingUp, CheckCircle, Clock, Shield } from "lucide-react"

export default function LeaderSuscripcionPage() {
  const { community, members, loading, user } = useLeaderCommunity()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  const trialMembers = members.filter(m => m.trial_ends_at && new Date(m.trial_ends_at) > new Date())
  const activeMembers = members.filter(m => m.role !== "leader")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Suscripcion</h1>
        <p className="text-sm text-muted-foreground">Gestiona tu plan y el estado de tu comunidad</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tu plan</p>
              <p className="text-lg font-bold text-foreground">Lider</p>
              <p className="text-[10px] text-muted-foreground">Comunidad activa</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Miembros</p>
              <p className="text-lg font-bold text-foreground">{activeMembers.length}</p>
              <p className="text-[10px] text-muted-foreground">{trialMembers.length} en trial</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Comunidad</p>
              <p className="text-lg font-bold text-foreground">{community?.nombre || "Sin nombre"}</p>
              <p className="text-[10px] text-muted-foreground">Trial: {community?.free_trial_days || 0} dias</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Estado de Miembros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeMembers.length > 0 ? (
            <div className="space-y-2">
              {activeMembers.map((m) => {
                const isInTrial = m.trial_ends_at && new Date(m.trial_ends_at) > new Date()
                const trialDays = m.trial_ends_at ? Math.max(0, Math.ceil((new Date(m.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0

                return (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/30 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isInTrial ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400">
                          <Clock className="h-3 w-3" />
                          Trial {trialDays}d
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                          <CheckCircle className="h-3 w-3" />
                          Activo
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay miembros en tu comunidad aun.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
