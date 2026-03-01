"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EMBUDOS } from "@/lib/embudos-config"
import { useAuth } from "@/lib/auth-context"
import {
  Users,
  Route,
  MessageSquare,
  Shield,
  Copy,
  Check,
  ChevronRight,
  UserX,
  Loader2,
  RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface DBCommunity {
  id: string
  nombre: string
  codigo: string | null
  embudos_default: string[]
  color: string
  descripcion: string
  activa: boolean
  leader_email: string | null
  leader_name: string | null
  cuota_miembro: number
  member_count: number
  settings: {
    zoom_enabled: boolean
    calendar_enabled: boolean
    whatsapp_reminders_enabled: boolean
    agenda_enabled: boolean
  }
}

interface DBMember {
  id: string
  member_id: string
  community_id: string
  email: string
  name: string
  discount_code: string | null
  created_at: string
}

export default function AdminComunidadesPage() {
  const { user } = useAuth()
  const [communities, setCommunities] = useState<DBCommunity[]>([])
  const [members, setMembers] = useState<DBMember[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [tab, setTab] = useState<"miembros" | "config">("miembros")
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async (commId?: string) => {
    setLoading(true)
    try {
      const url = commId
        ? `/api/communities?communityId=${commId}`
        : `/api/communities`
      const res = await fetch(url)
      const data = await res.json()
      setCommunities(data.communities || [])
      setMembers(data.members || [])

      // Auto-select first community
      if (!commId && data.communities?.length > 0 && !selectedId) {
        setSelectedId(data.communities[0].id)
      }
    } catch (err) {
      console.error("Error loading communities:", err)
    }
    setLoading(false)
  }, [selectedId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Reload members when selecting a community
  useEffect(() => {
    if (selectedId) loadData(selectedId)
  }, [selectedId, loadData])

  const selected = communities.find((c) => c.id === selectedId)
  const filteredMembers = members.filter((m) => m.community_id === selectedId)

  const handleUpdateSettings = async (field: keyof DBCommunity["settings"], value: boolean) => {
    if (!selected) return
    const currentSettings = selected.settings || {
      zoom_enabled: false,
      calendar_enabled: false,
      whatsapp_reminders_enabled: false,
      agenda_enabled: false
    }
    const newSettings = { ...currentSettings, [field]: value }
    try {
      const res = await fetch("/api/communities", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selected.id, settings: newSettings }),
      })
      if (res.ok) {
        setCommunities((prev) =>
          prev.map((c) => (c.id === selected.id ? { ...c, settings: newSettings } : c))
        )
      }
    } catch (err) {
      console.error("Error updating settings:", err)
    }
  }

  const handleCopyCode = () => {
    if (selected?.codigo) {
      navigator.clipboard.writeText(selected.codigo)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Comunidades</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona las comunidades de tu plataforma. Cada comunidad tiene miembros, embudos y contenido separado.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => loadData(selectedId || undefined)}
          disabled={loading}
          className="gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Actualizar
        </Button>
      </div>

      {/* Community selector */}
      <div className="grid gap-4 md:grid-cols-3">
        {communities.filter(c => c.activa).map((community) => {
          const isSelected = selectedId === community.id
          return (
            <button
              key={community.id}
              onClick={() => { setSelectedId(community.id); setTab("miembros") }}
              className={cn(
                "flex flex-col gap-3 rounded-xl border p-5 text-left transition-all duration-200",
                isSelected
                  ? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10"
                  : "border-border/30 bg-card/40 hover:border-border/60"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="h-3 w-3 rounded-full" style={{ backgroundColor: community.color }} />
                  <span className="text-sm font-bold text-foreground">{community.nombre}</span>
                </div>
                <ChevronRight className={cn(
                  "h-4 w-4 transition-transform",
                  isSelected ? "rotate-90 text-primary" : "text-muted-foreground"
                )} />
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2">{community.descripcion}</p>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {community.member_count} miembros
                </span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Route className="h-3 w-3" />
                  {community.embudos_default.length} embudos
                </span>
                {community.codigo && (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <Shield className="h-3 w-3" />
                    Con codigo
                  </span>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Selected community detail */}
      {selected && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full" style={{ backgroundColor: selected.color }} />
                <CardTitle className="text-lg">{selected.nombre}</CardTitle>
                {selected.codigo && (
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-muted/30 px-2.5 py-1 text-xs font-mono text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {copiedCode ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                    {selected.codigo}
                  </button>
                )}
                {selected.leader_name && (
                  <span className="text-xs text-muted-foreground">
                    Lider: <span className="font-medium text-foreground">{selected.leader_name}</span>
                  </span>
                )}
              </div>
              {/* Tabs */}
              <div className="flex rounded-lg border border-border/30 bg-muted/20 p-0.5">
                {(["miembros", "config"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={cn(
                      "rounded-md px-3 py-1.5 text-xs font-medium transition-all",
                      tab === t
                        ? "bg-primary/15 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t === "miembros" ? "Miembros" : "Config"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : tab === "miembros" ? (
              <div>
                {filteredMembers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Users className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">Aun no hay miembros en esta comunidad.</p>
                    {selected.codigo && (
                      <p className="mt-1 text-xs text-muted-foreground/60">
                        {'Comparte el codigo '}
                        <span className="font-mono font-bold text-primary">{selected.codigo}</span>
                        {' para que se unan al registrarse.'}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border border-border/30 bg-card/30 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {member.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{member.name}</p>
                            <p className="text-xs text-muted-foreground">{member.email}</p>
                          </div>
                          {member.discount_code && (
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono text-emerald-400">
                              {member.discount_code}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground/60">
                            {new Date(member.created_at).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-xs"
                          >
                            <Route className="h-3 w-3" />
                            Habilitar embudos
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Config tab */
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Informacion</h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
                      <span className="text-xs text-muted-foreground">Nombre</span>
                      <p className="text-sm font-medium text-foreground">{selected.nombre}</p>
                    </div>
                    <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
                      <span className="text-xs text-muted-foreground">Codigo de acceso</span>
                      <p className="text-sm font-mono font-medium text-foreground">{selected.codigo || "Sin codigo (abierta)"}</p>
                    </div>
                    <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
                      <span className="text-xs text-muted-foreground">Lider</span>
                      <p className="text-sm font-medium text-foreground">{selected.leader_name || "Sin lider asignado"}</p>
                    </div>
                    <div className="rounded-lg border border-border/30 bg-muted/10 p-3">
                      <span className="text-xs text-muted-foreground">Cuota mensual miembros</span>
                      <p className="text-sm font-medium text-foreground">${selected.cuota_miembro} USD</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Embudos por defecto</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.embudos_default.length > 0 ? (
                      selected.embudos_default.map((fId) => {
                        const embudo = EMBUDOS.find((e) => e.id === fId)
                        return (
                          <span
                            key={fId}
                            className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
                          >
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: embudo?.color || "#8b5cf6" }} />
                            {embudo?.nombre || fId}
                          </span>
                        )
                      })
                    ) : (
                      <span className="text-xs text-muted-foreground">Ningun embudo asignado por defecto.</span>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Estadisticas</h4>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">${selected.cuota_miembro}</p>
                      <span className="text-xs text-muted-foreground">Cuota/mes</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-4">Funciones Habilitadas</h4>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card/50 p-4 transition-all hover:border-primary/30">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-foreground">Zoom Meetings</span>
                        <span className="text-[10px] text-muted-foreground font-medium">Crear enlaces de salas</span>
                      </div>
                      <Button
                        size="sm"
                        variant={selected.settings?.zoom_enabled ? "default" : "outline"}
                        className={cn("h-8 px-4 rounded-lg text-[11px] font-bold", selected.settings?.zoom_enabled && "bg-emerald-500 hover:bg-emerald-600")}
                        onClick={() => handleUpdateSettings("zoom_enabled", !selected.settings?.zoom_enabled)}
                      >
                        {selected.settings?.zoom_enabled ? "ON" : "OFF"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card/50 p-4 transition-all hover:border-primary/30">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-foreground">Google Calendar</span>
                        <span className="text-[10px] text-muted-foreground font-medium">Sincronizar citas</span>
                      </div>
                      <Button
                        size="sm"
                        variant={selected.settings?.calendar_enabled ? "default" : "outline"}
                        className={cn("h-8 px-4 rounded-lg text-[11px] font-bold", selected.settings?.calendar_enabled && "bg-emerald-500 hover:bg-emerald-600")}
                        onClick={() => handleUpdateSettings("calendar_enabled", !selected.settings?.calendar_enabled)}
                      >
                        {selected.settings?.calendar_enabled ? "ON" : "OFF"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card/50 p-4 transition-all hover:border-primary/30">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-foreground">Recordatorios WhatsApp</span>
                        <span className="text-[10px] text-muted-foreground font-medium">Mensajes automaticos</span>
                      </div>
                      <Button
                        size="sm"
                        variant={selected.settings?.whatsapp_reminders_enabled ? "default" : "outline"}
                        className={cn("h-8 px-4 rounded-lg text-[11px] font-bold", selected.settings?.whatsapp_reminders_enabled && "bg-emerald-500 hover:bg-emerald-600")}
                        onClick={() => handleUpdateSettings("whatsapp_reminders_enabled", !selected.settings?.whatsapp_reminders_enabled)}
                      >
                        {selected.settings?.whatsapp_reminders_enabled ? "ON" : "OFF"}
                      </Button>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-border/30 bg-card/50 p-4 transition-all hover:border-primary/30">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-foreground">Agenda Configurable</span>
                        <span className="text-[10px] text-muted-foreground font-medium">Permitir gestionar citas</span>
                      </div>
                      <Button
                        size="sm"
                        variant={selected.settings?.agenda_enabled ? "default" : "outline"}
                        className={cn("h-8 px-4 rounded-lg text-[11px] font-bold", selected.settings?.agenda_enabled && "bg-emerald-500 hover:bg-emerald-600")}
                        onClick={() => handleUpdateSettings("agenda_enabled", !selected.settings?.agenda_enabled)}
                      >
                        {selected.settings?.agenda_enabled ? "ON" : "OFF"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
