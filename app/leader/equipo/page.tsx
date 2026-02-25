"use client"

import { useState } from "react"
import { useLeaderCommunity } from "@/hooks/use-leader-community"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Search, Copy, Check, AtSign, Shield, Clock } from "lucide-react"

export default function LeaderEquipoPage() {
  const { community, members, loading } = useLeaderCommunity()
  const [search, setSearch] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  const filtered = search.trim()
    ? members.filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()))
    : members

  const handleCopyCode = () => {
    if (community?.codigo) {
      navigator.clipboard.writeText(community.codigo)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi Equipo</h1>
          <p className="text-sm text-muted-foreground">
            {members.length} miembro{members.length !== 1 ? "s" : ""} en {community?.nombre || "tu comunidad"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {community?.codigo && (
            <Button variant="outline" size="sm" onClick={handleCopyCode} className="gap-1.5 text-xs">
              {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copiedCode ? "Copiado" : community.codigo}
            </Button>
          )}
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
      </div>

      {filtered.length > 0 ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((m) => {
            const isInTrial = m.trial_ends_at && new Date(m.trial_ends_at) > new Date()
            const trialDays = m.trial_ends_at ? Math.max(0, Math.ceil((new Date(m.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0

            return (
              <Card key={m.id} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-primary shrink-0"
                      style={{ backgroundColor: `${community?.color || "#6366f1"}20` }}
                    >
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">{m.name}</p>
                        {m.role === "leader" && (
                          <span className="rounded-full bg-violet-500/10 px-1.5 py-0.5 text-[9px] font-bold text-violet-400">Lider</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      {m.username && (
                        <p className="text-[10px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                          <AtSign className="h-2.5 w-2.5" />
                          {m.username}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        m.activo ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"
                      }`}>
                        {m.activo ? "Activo" : "Pendiente"}
                      </span>
                      {isInTrial && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          <Clock className="h-2.5 w-2.5" />
                          Trial {trialDays}d
                        </span>
                      )}
                    </div>
                  </div>
                  {m.sponsor_username && (
                    <p className="mt-2 text-[10px] text-muted-foreground/50 ml-[52px]">
                      Patrocinador: @{m.sponsor_username}
                    </p>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/15" />
            <p className="mt-4 text-sm font-medium text-foreground">
              {search ? "No se encontraron miembros" : "Tu equipo esta listo para crecer"}
            </p>
            <p className="mt-1.5 text-xs text-muted-foreground">
              {search ? "Intenta con otro termino de busqueda." : "Comparte tu codigo de comunidad para que las personas se unan a tu equipo."}
            </p>
            {!search && community?.codigo && (
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-border/50 bg-secondary/50 px-4 py-2">
                <Shield className="h-4 w-4 text-primary" />
                <span className="font-mono font-bold text-primary">{community.codigo}</span>
                <Button variant="ghost" size="sm" onClick={handleCopyCode} className="h-6 px-2 text-[10px]">
                  {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
