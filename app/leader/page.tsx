"use client"

import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MetricCard } from "@/components/admin/metric-card"
import { Users, Target, Route, Trophy, TrendingUp, DollarSign, UserPlus, Shield, Copy, Check, Link2, GraduationCap, Loader2, AtSign, Clock, Plus } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import useSWR, { useSWRConfig } from "swr"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

export default function LeaderDashboardPage() {
  const { user } = useAuth()
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const { data, isLoading } = useSWR(
    user?.email ? `/api/communities/my-community?email=${encodeURIComponent(user.email)}` : null,
    fetcher,
    { refreshInterval: 15000 }
  )
  const { mutate } = useSWRConfig()

  const [newCommName, setNewCommName] = useState("")
  const [newCommCode, setNewCommCode] = useState("")
  const [newCommDesc, setNewCommDesc] = useState("")
  const [isCreating, setIsCreating] = useState(false)

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    try {
      const res = await fetch("/api/communities/my-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          nombre: newCommName,
          codigo: newCommCode,
          descripcion: newCommDesc,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        toast.success("¡Comunidad creada con éxito!")
        // @ts-ignore
        mutate(`/api/communities/my-community?email=${encodeURIComponent(user?.email || "")}`)
      } else {
        toast.error(data.error || "Error al crear la comunidad")
      }
    } catch {
      toast.error("Error de conexión")
    } finally {
      setIsCreating(false)
    }
  }

  const community = data?.community
  const member = data?.member
  const members = data?.members || []
  const directReferrals = data?.directReferrals || []
  const stats = data?.stats || {}

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    )
  }

  const communityColor = community?.color || "#8b5cf6"
  const communityCode = community?.codigo || member?.username?.toUpperCase() || ""
  const referralLink = member?.username
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/login?ref=${member.username}`
    : ""

  function copyCode() {
    if (!communityCode) return
    navigator.clipboard.writeText(communityCode)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  function copyLink() {
    if (!referralLink) return
    navigator.clipboard.writeText(referralLink)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const quickActions = [
    { href: "/leader/equipo", label: "Gestionar Equipo", icon: Users, desc: "Ver y administrar miembros" },
    { href: "/leader/embudos", label: "Configurar Embudos", icon: Route, desc: "Crear embudos para tu equipo" },
    { href: "/leader/retos", label: "Crear Retos", icon: Trophy, desc: "Desafios para tu comunidad" },
    { href: "/leader/academia", label: "Subir Contenido", icon: GraduationCap, desc: "Cursos y videos de entrenamiento" },
    { href: "/leader/leads", label: "Ver Leads", icon: Target, desc: "Prospectos capturados" },
    { href: "/leader/mi-link", label: "Mi Link", icon: Link2, desc: "Tu landing page personal" },
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/50 p-8" style={{ background: `linear-gradient(135deg, ${communityColor}10, transparent)` }}>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ backgroundColor: `${communityColor}20` }}>
              <Shield className="h-5 w-5" style={{ color: communityColor }} />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Panel de Lider</p>
              <h1 className="text-2xl font-bold text-foreground">{community?.nombre || `Comunidad de ${user?.name}`}</h1>
            </div>
            {!community?.codigo && (
              <div className="ml-auto">
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white transition-all hover:bg-violet-700 shadow-lg shadow-violet-500/20">
                      <Plus className="h-4 w-4" />
                      Crear Comunidad
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] border-border/50 bg-background/95 backdrop-blur-xl">
                    <DialogHeader>
                      <DialogTitle className="text-xl font-bold">Configura tu Comunidad</DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground">
                        Crea tu espacio exclusivo para que tus referidos se unan automaticamente.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateCommunity} className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="comm-name" className="text-xs font-semibold">Nombre de la Comunidad</Label>
                        <Input
                          id="comm-name"
                          placeholder="Ej: Equipo Diamantes"
                          value={newCommName}
                          onChange={(e) => setNewCommName(e.target.value)}
                          className="rounded-xl border-border/50 bg-white/[0.02]"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comm-code" className="text-xs font-semibold">Codigo de Invitacion (UNICO)</Label>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50" />
                          <Input
                            id="comm-code"
                            placeholder="DIAMANTE2026"
                            value={newCommCode}
                            onChange={(e) => setNewCommCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))}
                            className="pl-9 rounded-xl border-border/50 bg-white/[0.02] font-mono uppercase"
                            required
                          />
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 italic">Este codigo sera el que usen tus miembros al registrarse.</p>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="comm-desc" className="text-xs font-semibold">Descripcion (Opcional)</Label>
                        <Textarea
                          id="comm-desc"
                          placeholder="Cuentales de que trata tu equipo..."
                          value={newCommDesc}
                          onChange={(e) => setNewCommDesc(e.target.value)}
                          className="rounded-xl border-border/50 bg-white/[0.02] min-h-[80px]"
                        />
                      </div>
                      <DialogFooter className="pt-2">
                        <button
                          type="submit"
                          disabled={isCreating}
                          className="w-full rounded-xl bg-violet-600 py-3 text-sm font-bold text-white transition-all hover:bg-violet-700 disabled:opacity-50"
                        >
                          {isCreating ? (
                            <div className="flex items-center justify-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Creando...
                            </div>
                          ) : "Activar Mi Comunidad"}
                        </button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
          {community?.descripcion && (
            <p className="mt-2 text-sm text-muted-foreground max-w-lg">{community.descripcion}</p>
          )}
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              {stats.totalMembers || 0} miembros
            </span>
            {member?.username && (
              <span className="flex items-center gap-1.5 font-mono">
                <AtSign className="h-3.5 w-3.5" />
                {member.username}
              </span>
            )}
            {communityCode && community?.codigo && (
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors hover:opacity-80"
                style={{ backgroundColor: `${communityColor}20`, color: communityColor }}
              >
                Codigo: {communityCode}
                {copiedCode ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Referral link card */}
      {referralLink && (
        <Card className="border-border/50">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Link2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground">Tu link de referido</p>
              <p className="text-[11px] text-muted-foreground truncate font-mono">{referralLink}</p>
            </div>
            <button
              onClick={copyLink}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            >
              {copiedLink ? <><Check className="h-3.5 w-3.5" /> Copiado</> : <><Copy className="h-3.5 w-3.5" /> Copiar</>}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Miembros"
          value={stats.totalMembers || 0}
          change={stats.thisWeek ? `+${stats.thisWeek} esta semana` : "Sin nuevos"}
          changeType={stats.thisWeek > 0 ? "positive" : "neutral"}
          icon={Users}
        />
        <MetricCard
          title="En Trial"
          value={stats.inTrial || 0}
          change="Periodo de prueba"
          changeType="neutral"
          icon={Clock}
        />
        <MetricCard
          title="Referidos Directos"
          value={directReferrals.length}
          change="Tu primer nivel"
          changeType={directReferrals.length > 0 ? "positive" : "neutral"}
          icon={UserPlus}
        />
        <MetricCard
          title="Ingresos Estimados"
          value={`$${stats.mrr || 0}`}
          change="MRR de tu comunidad"
          changeType="positive"
          icon={DollarSign}
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Herramientas Disponibles</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="group cursor-pointer border-border/50 transition-all hover:border-primary/30 hover:shadow-md hover:shadow-primary/5">
                <CardContent className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
                      <action.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{action.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{action.desc}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Direct referrals */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <UserPlus className="h-4 w-4 text-primary" />
            Referidos Directos (Primer Nivel)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {directReferrals.length > 0 ? (
            <div className="space-y-3">
              {directReferrals.slice(0, 10).map((m: { member_id: string; name: string; email: string; username: string; activo: boolean; created_at: string; trial_ends_at: string | null }) => {
                const inTrial = m.trial_ends_at && new Date(m.trial_ends_at) > new Date()
                return (
                  <div key={m.member_id} className="flex items-center justify-between rounded-lg border border-border/30 p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">@{m.username || "sin-usuario"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {inTrial ? (
                        <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400">
                          Trial
                        </span>
                      ) : m.activo ? (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                          Activo
                        </span>
                      ) : (
                        <span className="rounded-full bg-zinc-500/10 px-2 py-0.5 text-[10px] font-medium text-zinc-400">
                          Pendiente
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(m.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">Aun no tienes referidos directos.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {"Comparte tu link de referido o el codigo "}
                <span className="font-mono font-bold text-primary">{communityCode || "de tu comunidad"}</span>
                {" para que se unan."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent community members */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-primary" />
            Miembros de la Comunidad
          </CardTitle>
        </CardHeader>
        <CardContent>
          {members.length > 0 ? (
            <div className="space-y-3">
              {members.filter((m: { email: string }) => m.email !== user?.email).slice(0, 10).map((m: { member_id: string; name: string; email: string; username: string; role: string; activo: boolean; created_at: string }) => (
                <div key={m.member_id} className="flex items-center justify-between rounded-lg border border-border/30 p-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{m.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[10px] text-muted-foreground">{m.email}</p>
                        {m.username && <p className="text-[10px] text-muted-foreground font-mono">@{m.username}</p>}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(m.created_at).toLocaleDateString("es-CO", { day: "numeric", month: "short" })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">Tu comunidad esta lista para crecer.</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Usa las herramientas de arriba para crear embudos, retos y contenido para tu equipo.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
