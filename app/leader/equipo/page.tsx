"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getCommunityById, getCommunityMembers } from "@/lib/communities-data"
import { EMBUDOS } from "@/lib/embudos-config"
import { updateMemberFunnels } from "@/lib/team-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Shield, Route, Check, Save, Search } from "lucide-react"
import { cn } from "@/lib/utils"

export default function LeaderEquipoPage() {
  const { user } = useAuth()
  const community = user?.communityId ? getCommunityById(user.communityId) : undefined
  const members = user?.communityId ? getCommunityMembers(user.communityId) : []
  const [search, setSearch] = useState("")
  const [selectedMember, setSelectedMember] = useState<string | null>(null)
  const [memberFunnels, setMemberFunnels] = useState<Record<string, string[]>>({})
  const [saved, setSaved] = useState<string | null>(null)

  if (!community) return <p className="py-10 text-center text-muted-foreground">Comunidad no encontrada.</p>

  const filtered = search.trim()
    ? members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()))
    : members

  const toggleFunnel = (memberId: string, funnelId: string) => {
    setMemberFunnels((prev) => {
      const current = prev[memberId] || community.embudos_default || []
      const next = current.includes(funnelId)
        ? current.filter((f) => f !== funnelId)
        : [...current, funnelId]
      return { ...prev, [memberId]: next }
    })
  }

  const saveMemberFunnels = (memberId: string) => {
    const funnels = memberFunnels[memberId] || community.embudos_default || []
    updateMemberFunnels(memberId, funnels)
    setSaved(memberId)
    setTimeout(() => setSaved(null), 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi Equipo</h1>
          <p className="text-sm text-muted-foreground">{members.length} miembros en {community.nombre}</p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card/50 px-3 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar miembro..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none w-48"
          />
        </div>
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((m) => {
            const isSelected = selectedMember === m.memberId
            const funnels = memberFunnels[m.memberId] || community.embudos_default || []

            return (
              <Card key={m.memberId} className={cn("border-border/50 transition-all", isSelected && "border-primary/30 shadow-md shadow-primary/5")}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-primary" style={{ backgroundColor: `${community.color}20` }}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{m.name}</p>
                        <p className="text-xs text-muted-foreground">{m.email}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedMember(isSelected ? null : m.memberId)} className="text-xs">
                      {isSelected ? "Cerrar" : "Embudos"}
                    </Button>
                  </div>
                </CardHeader>
                {isSelected && (
                  <CardContent className="pt-2">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                        <Route className="h-3.5 w-3.5" />
                        Embudos habilitados
                      </p>
                      <Button size="sm" onClick={() => saveMemberFunnels(m.memberId)} className={cn("gap-1 text-xs h-7", saved === m.memberId && "bg-emerald-600 hover:bg-emerald-600")}>
                        {saved === m.memberId ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
                        {saved === m.memberId ? "Guardado" : "Guardar"}
                      </Button>
                    </div>
                    <div className="grid gap-2 grid-cols-2">
                      {EMBUDOS.map((embudo) => {
                        const isActive = funnels.includes(embudo.id)
                        return (
                          <button
                            key={embudo.id}
                            onClick={() => toggleFunnel(m.memberId, embudo.id)}
                            className={cn(
                              "flex items-center gap-2 rounded-lg border p-2.5 text-left text-xs transition-all",
                              isActive ? "border-primary/30 bg-primary/5" : "border-border/30 bg-card/30 hover:border-border/60"
                            )}
                          >
                            <div className={cn("h-2.5 w-2.5 rounded-full transition-opacity", isActive ? "opacity-100" : "opacity-30")} style={{ backgroundColor: embudo.color }} />
                            <span className={cn("font-medium", isActive ? "text-foreground" : "text-muted-foreground")}>{embudo.nombre}</span>
                          </button>
                        )
                      })}
                    </div>
                  </CardContent>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-3 text-sm text-muted-foreground">
              {search ? "No se encontraron miembros." : "Aun no hay miembros en tu comunidad."}
            </p>
            <p className="mt-1 text-xs text-muted-foreground/60">
              {"Comparte el codigo "}
              <span className="font-mono font-bold" style={{ color: community.color }}>{community.codigo}</span>
              {" para que se registren."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
