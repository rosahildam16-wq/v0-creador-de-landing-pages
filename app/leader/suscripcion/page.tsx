"use client"

import { useAuth } from "@/lib/auth-context"
import { getCommunityById, getCommunityMembers } from "@/lib/communities-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, DollarSign, Users, TrendingUp, CheckCircle } from "lucide-react"

export default function LeaderSuscripcionPage() {
  const { user } = useAuth()
  const community = user?.communityId ? getCommunityById(user.communityId) : undefined
  const members = user?.communityId ? getCommunityMembers(user.communityId) : []

  if (!community) return <p className="py-10 text-center text-muted-foreground">Comunidad no encontrada.</p>

  const monthlyIncome = members.length * community.cuota_miembro

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Suscripcion y Facturacion</h1>
        <p className="text-sm text-muted-foreground">Gestiona tu plan y cuotas de miembros</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <CreditCard className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tu plan</p>
              <p className="text-lg font-bold text-foreground">Pro</p>
              <p className="text-[10px] text-muted-foreground">$47/mes USDT</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ingresos mensuales</p>
              <p className="text-lg font-bold text-foreground">${monthlyIncome}</p>
              <p className="text-[10px] text-muted-foreground">{members.length} miembros x ${community.cuota_miembro}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ganancia neta</p>
              <p className="text-lg font-bold text-foreground">${monthlyIncome - 47}</p>
              <p className="text-[10px] text-muted-foreground">Despues de tu plan</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Member payments */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Estado de Pagos de Miembros
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="space-y-2">
              {members.map((m) => {
                const hasPaid = Math.random() > 0.3
                return (
                  <div key={m.memberId} className="flex items-center justify-between rounded-lg border border-border/30 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {m.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">${community.cuota_miembro}</span>
                      {hasPaid ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-500">
                          <CheckCircle className="h-3 w-3" />
                          Pagado
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-500">
                          Pendiente
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">No hay miembros aun.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
