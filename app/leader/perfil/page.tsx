"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { useLeaderCommunity } from "@/hooks/use-leader-community"
import { User, Mail, Lock, Save, Check, Shield, Calendar, Users, Link2, Copy, AtSign } from "lucide-react"

export default function LeaderPerfilPage() {
  const { user } = useAuth()
  const { community, stats, isLoading } = useLeaderCommunity()
  const [saved, setSaved] = useState(false)
  const [nombre, setNombre] = useState(user?.name || "")
  const [communityName, setCommunityName] = useState("")
  const [communityNameLoaded, setCommunityNameLoaded] = useState(false)
  const [savingCommunity, setSavingCommunity] = useState(false)
  const [savedCommunity, setSavedCommunity] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  // Sync community name once loaded
  if (community?.nombre && !communityNameLoaded) {
    setCommunityName(community.nombre)
    setCommunityNameLoaded(true)
  }

  const referralLink = user?.username
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/registro?ref=${user.username}`
    : ""

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleSaveCommunityName = async () => {
    if (!communityName.trim() || !user?.email) return
    setSavingCommunity(true)
    try {
      await fetch("/api/communities/my-community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email, nombre: communityName.trim() }),
      })
      setSavedCommunity(true)
      setTimeout(() => setSavedCommunity(false), 2000)
    } catch { /* noop */ }
    setSavingCommunity(false)
  }

  const copyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mi perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestiona tu informacion personal y de tu comunidad</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Profile card + Edit form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Avatar + Info */}
          <div className="overflow-hidden rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm">
            <div className="relative h-24" style={{ background: `linear-gradient(to right, ${community?.color || "#8b5cf6"}33, transparent)` }} />
            <div className="px-6 pb-6">
              <div className="-mt-10 flex items-end gap-4">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card text-2xl font-bold text-white shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${community?.color || "#8b5cf6"}cc, ${community?.color || "#8b5cf6"})` }}
                >
                  {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "L"}
                </div>
                <div className="mb-1 flex flex-col">
                  <span className="text-lg font-bold text-foreground">{user?.name}</span>
                  <div className="flex items-center gap-2">
                    {user?.username && (
                      <span className="text-sm text-muted-foreground font-mono">@{user.username}</span>
                    )}
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: `${community?.color || "#8b5cf6"}15`, color: community?.color || "#8b5cf6" }}>
                      Lider
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div className="rounded-2xl border border-border/30 bg-card/60 p-6 backdrop-blur-sm">
            <h2 className="mb-4 text-base font-semibold text-foreground">Informacion personal</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <User className="h-3.5 w-3.5 text-primary" />
                  Nombre completo
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full rounded-xl border border-border/40 bg-background/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <AtSign className="h-3.5 w-3.5 text-primary" />
                  Nombre de usuario
                </label>
                <input
                  type="text"
                  value={user?.username || ""}
                  disabled
                  className="w-full rounded-xl border border-border/40 bg-background/30 px-4 py-2.5 text-sm text-muted-foreground font-mono outline-none"
                />
                <p className="mt-1 text-xs text-muted-foreground/60">El nombre de usuario no se puede cambiar</p>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full rounded-xl border border-border/40 bg-background/30 px-4 py-2.5 text-sm text-muted-foreground outline-none"
                />
                <p className="mt-1 text-xs text-muted-foreground/60">El email no se puede cambiar</p>
              </div>
              <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-foreground/80">
                  <Lock className="h-3.5 w-3.5 text-primary" />
                  Contrasena
                </label>
                <input
                  type="password"
                  placeholder="Nueva contrasena"
                  className="w-full rounded-xl border border-border/40 bg-background/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
                <p className="mt-1 text-xs text-muted-foreground/60">Deja en blanco para no cambiar</p>
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98]"
              >
                {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                {saved ? "Guardado" : "Guardar cambios"}
              </button>
            </div>
          </div>
        </div>

        {/* Right: Sidebar info */}
        <div className="space-y-6">
          {/* Community - editable */}
          <div className="rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Shield className="h-4 w-4 text-primary" />
              Mi comunidad
            </h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-foreground/70">Nombre de la comunidad</label>
                <input
                  type="text"
                  value={communityName}
                  onChange={(e) => setCommunityName(e.target.value)}
                  placeholder="Nombre de tu comunidad"
                  className="w-full rounded-xl border border-border/40 bg-background/60 px-4 py-2.5 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                />
              </div>
              {community?.codigo && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-foreground/70">Codigo de invitacion</label>
                  <div className="rounded-xl border border-border/40 bg-background/30 px-4 py-2.5 text-sm text-muted-foreground font-mono">
                    {community.codigo}
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground/60">Comparte este codigo para que otros se unan a tu comunidad</p>
                </div>
              )}
              <button
                onClick={handleSaveCommunityName}
                disabled={savingCommunity || !communityName.trim() || communityName === community?.nombre}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
              >
                {savedCommunity ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {savedCommunity ? "Guardado" : savingCommunity ? "Guardando..." : "Guardar nombre"}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Calendar className="h-4 w-4 text-primary" />
              Estadisticas
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total miembros</span>
                <span className="font-medium text-foreground">{stats?.totalMembers || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Activos</span>
                <span className="font-medium text-foreground">{stats?.activeMembers || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">En trial</span>
                <span className="font-medium text-foreground">{stats?.inTrial || 0}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">MRR estimado</span>
                <span className="font-medium text-foreground">${stats?.mrr || 0}</span>
              </div>
            </div>
          </div>

          {/* Referral link */}
          <div className="rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Link2 className="h-4 w-4 text-primary" />
              Link de referido
            </h3>
            {referralLink ? (
              <div className="space-y-2">
                <div className="rounded-lg border border-border/40 bg-background/40 px-3 py-2">
                  <p className="text-[11px] font-mono text-muted-foreground break-all">{referralLink}</p>
                </div>
                <button
                  onClick={copyLink}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                >
                  {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copiedLink ? "Copiado" : "Copiar link"}
                </button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tienes username configurado</p>
            )}
          </div>

          {/* Team quick view */}
          <div className="rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4 text-primary" />
              Equipo reciente
            </h3>
            <p className="text-xs text-muted-foreground">
              {stats?.totalMembers
                ? `${stats.totalMembers} miembro${stats.totalMembers > 1 ? "s" : ""} en tu comunidad`
                : "Aun no tienes miembros. Comparte tu link de referido para crecer tu equipo."
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
