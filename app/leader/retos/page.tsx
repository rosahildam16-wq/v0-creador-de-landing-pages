"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getCommunityById } from "@/lib/communities-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trophy, Plus, Flame, Calendar, Users, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface CommunityChallenge {
  id: string
  communityId: string
  titulo: string
  descripcion: string
  tipo: "diario" | "semanal" | "mensual"
  meta: number
  metrica: string
  activo: boolean
  createdAt: string
}

function getChallenges(communityId: string): CommunityChallenge[] {
  try {
    const raw = localStorage.getItem("mf_community_challenges") || "[]"
    return (JSON.parse(raw) as CommunityChallenge[]).filter((c) => c.communityId === communityId)
  } catch { return [] }
}

function saveChallenge(challenge: CommunityChallenge) {
  try {
    const raw = localStorage.getItem("mf_community_challenges") || "[]"
    const all = JSON.parse(raw) as CommunityChallenge[]
    all.unshift(challenge)
    localStorage.setItem("mf_community_challenges", JSON.stringify(all))
  } catch { /* noop */ }
}

function deleteChallenge(id: string) {
  try {
    const raw = localStorage.getItem("mf_community_challenges") || "[]"
    const all = (JSON.parse(raw) as CommunityChallenge[]).filter((c) => c.id !== id)
    localStorage.setItem("mf_community_challenges", JSON.stringify(all))
  } catch { /* noop */ }
}

export default function LeaderRetosPage() {
  const { user } = useAuth()
  const community = user?.communityId ? getCommunityById(user.communityId) : undefined
  const [challenges, setChallenges] = useState<CommunityChallenge[]>([])
  const [showForm, setShowForm] = useState(false)
  const [titulo, setTitulo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [tipo, setTipo] = useState<"diario" | "semanal" | "mensual">("semanal")
  const [meta, setMeta] = useState("5")
  const [metrica, setMetrica] = useState("leads")

  useEffect(() => {
    if (user?.communityId) setChallenges(getChallenges(user.communityId))
  }, [user?.communityId])

  if (!community) return <p className="py-10 text-center text-muted-foreground">Comunidad no encontrada.</p>

  const handleCreate = () => {
    if (!titulo.trim()) return
    const newChallenge: CommunityChallenge = {
      id: `reto-${Date.now()}`,
      communityId: community.id,
      titulo: titulo.trim(),
      descripcion: descripcion.trim(),
      tipo,
      meta: parseInt(meta) || 5,
      metrica,
      activo: true,
      createdAt: new Date().toISOString(),
    }
    saveChallenge(newChallenge)
    setChallenges((prev) => [newChallenge, ...prev])
    setTitulo("")
    setDescripcion("")
    setShowForm(false)
  }

  const handleDelete = (id: string) => {
    deleteChallenge(id)
    setChallenges((prev) => prev.filter((c) => c.id !== id))
  }

  const tipoIcon = { diario: Flame, semanal: Calendar, mensual: Trophy }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Retos de {community.nombre}</h1>
          <p className="text-sm text-muted-foreground">Crea retos para motivar a tu equipo</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-1.5">
          <Plus className="h-4 w-4" />
          Nuevo Reto
        </Button>
      </div>

      {showForm && (
        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Titulo del Reto</label>
              <input type="text" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ej: Reto 10 leads en 7 dias" className="mt-1 w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Descripcion</label>
              <textarea value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Describe el reto..." rows={2} className="mt-1 w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/40 resize-none" />
            </div>
            <div className="grid gap-4 grid-cols-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Tipo</label>
                <select value={tipo} onChange={(e) => setTipo(e.target.value as typeof tipo)} className="mt-1 w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-sm text-foreground focus:outline-none">
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Meta</label>
                <input type="number" value={meta} onChange={(e) => setMeta(e.target.value)} className="mt-1 w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-sm text-foreground focus:outline-none" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Metrica</label>
                <select value={metrica} onChange={(e) => setMetrica(e.target.value)} className="mt-1 w-full rounded-lg border border-border/50 bg-card px-3 py-2 text-sm text-foreground focus:outline-none">
                  <option value="leads">Leads</option>
                  <option value="ventas">Ventas</option>
                  <option value="referidos">Referidos</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
              <Button onClick={handleCreate}>Crear Reto</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {challenges.length > 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {challenges.map((c) => {
            const Icon = tipoIcon[c.tipo]
            return (
              <Card key={c.id} className="border-border/50">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                        <Icon className="h-4 w-4 text-amber-500" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{c.titulo}</p>
                        {c.descripcion && <p className="text-xs text-muted-foreground mt-0.5">{c.descripcion}</p>}
                        <div className="flex items-center gap-2 mt-2">
                          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground capitalize">{c.tipo}</span>
                          <span className="text-[10px] text-muted-foreground">Meta: {c.meta} {c.metrica}</span>
                        </div>
                      </div>
                    </div>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <Trophy className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-3 text-sm text-muted-foreground">No hay retos creados.</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Crea retos para motivar a tu equipo.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
