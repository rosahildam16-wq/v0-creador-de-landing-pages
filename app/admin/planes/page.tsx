"use client"

import { getAllCommunities } from "@/lib/communities-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, DollarSign, Users, TrendingUp, Shield } from "lucide-react"

export default function AdminPlanesPage() {
  const communities = getAllCommunities().filter((c) => c.activa)

  const totalLeaders = communities.filter((c) => c.leaderEmail).length
  const totalMemberRevenue = communities.reduce((sum, c) => sum + c.cuota_miembro * 10, 0) // estimated
  const platformRevenue = totalLeaders * 47 // avg plan price

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Planes y Cobros</h1>
        <p className="text-sm text-muted-foreground">Gestion global de suscripciones de lideres y cuotas de la plataforma</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalLeaders}</p>
              <p className="text-xs text-muted-foreground">Lideres activos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <DollarSign className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">${platformRevenue}</p>
              <p className="text-xs text-muted-foreground">Ingresos plataforma/mes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <TrendingUp className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{communities.length}</p>
              <p className="text-xs text-muted-foreground">Comunidades activas</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Community plan overview */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Comunidades y sus Planes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {communities.map((comm) => (
              <div key={comm.id} className="flex items-center justify-between rounded-lg border border-border/30 p-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: comm.color }} />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{comm.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {comm.leaderEmail ? `Lider: ${comm.leaderName || comm.leaderEmail}` : "Sin lider asignado"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">${comm.cuota_miembro}/mes</p>
                  <p className="text-[10px] text-muted-foreground">cuota por miembro</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
