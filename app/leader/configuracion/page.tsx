"use client"

import { useState } from "react"
import { useLeaderCommunity } from "@/hooks/use-leader-community"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Settings, Shield, Users, Route, Trophy, GraduationCap, MessagesSquare,
  Kanban, Target, Check, Save, Eye, EyeOff, Palette, Clock
} from "lucide-react"
import { cn } from "@/lib/utils"

interface FeaturePermission {
  id: string
  label: string
  description: string
  icon: React.ElementType
  enabled: boolean
  category: "navigation" | "tools"
}

const DEFAULT_PERMISSIONS: FeaturePermission[] = [
  {
    id: "mis-leads",
    label: "Mis Leads",
    description: "Los miembros pueden ver y gestionar sus leads personales",
    icon: Target,
    enabled: true,
    category: "navigation",
  },
  {
    id: "pipeline",
    label: "Pipeline",
    description: "Los miembros pueden ver su pipeline de ventas",
    icon: Kanban,
    enabled: true,
    category: "navigation",
  },
  {
    id: "mi-embudo",
    label: "Mi Embudo",
    description: "Los miembros pueden usar los embudos asignados",
    icon: Route,
    enabled: true,
    category: "navigation",
  },
  {
    id: "retos",
    label: "Retos",
    description: "Los miembros pueden ver y participar en retos",
    icon: Trophy,
    enabled: true,
    category: "navigation",
  },
  {
    id: "academia",
    label: "Academia",
    description: "Los miembros pueden acceder a los videos de entrenamiento",
    icon: GraduationCap,
    enabled: true,
    category: "navigation",
  },
  {
    id: "comunidad",
    label: "Comunidad (Feed)",
    description: "Los miembros pueden ver y publicar en el feed de la comunidad",
    icon: MessagesSquare,
    enabled: true,
    category: "navigation",
  },
]

const COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#d946ef",
  "#ec4899", "#f43f5e", "#ef4444", "#f97316",
  "#f59e0b", "#84cc16", "#22c55e", "#10b981",
  "#14b8a6", "#06b6d4", "#0ea5e9", "#3b82f6",
]

export default function LeaderConfiguracionPage() {
  const { community, members, loading, user } = useLeaderCommunity()
  const [permissions, setPermissions] = useState<FeaturePermission[]>(DEFAULT_PERMISSIONS)
  const [saved, setSaved] = useState(false)
  const [communityName, setCommunityName] = useState("")
  const [selectedColor, setSelectedColor] = useState("")
  const [trialDays, setTrialDays] = useState("7")

  // Initialize form values when community loads
  useState(() => {
    if (community) {
      setCommunityName(community.nombre)
      setSelectedColor(community.color)
      setTrialDays(String(community.free_trial_days || 7))
    }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  const togglePermission = (id: string) => {
    setPermissions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
    )
  }

  const handleSave = async () => {
    // Save community settings
    try {
      await fetch("/api/communities/my-community", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          nombre: communityName || community?.nombre,
          color: selectedColor || community?.color,
          free_trial_days: parseInt(trialDays) || 7,
        }),
      })
    } catch {
      // silently fail
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const enabledCount = permissions.filter((p) => p.enabled).length

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Configuracion</h1>
          <p className="text-sm text-muted-foreground">Personaliza tu comunidad y define los accesos de tus miembros</p>
        </div>
        <Button onClick={handleSave} className={cn("gap-1.5", saved && "bg-emerald-600 hover:bg-emerald-600")}>
          {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          {saved ? "Guardado" : "Guardar Cambios"}
        </Button>
      </div>

      {/* Community Settings */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            Datos de la Comunidad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Nombre de la comunidad</label>
              <input
                type="text"
                value={communityName || community?.nombre || ""}
                onChange={(e) => setCommunityName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border/50 bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Dias de trial gratuito
              </label>
              <input
                type="number"
                value={trialDays || String(community?.free_trial_days || 7)}
                onChange={(e) => setTrialDays(e.target.value)}
                min="0"
                max="90"
                className="mt-1 w-full rounded-lg border border-border/50 bg-card px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary/40"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Palette className="h-3 w-3" />
              Color de la comunidad
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={cn(
                    "h-8 w-8 rounded-lg transition-all",
                    (selectedColor || community?.color) === color
                      ? "ring-2 ring-offset-2 ring-offset-background scale-110"
                      : "hover:scale-105"
                  )}
                  style={{
                    backgroundColor: color,
                    ...(((selectedColor || community?.color) === color) ? { ringColor: color } : {}),
                  }}
                />
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-border/30 bg-secondary/30 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl shrink-0" style={{ backgroundColor: `${selectedColor || community?.color || "#6366f1"}15` }}>
              <Shield className="h-5 w-5" style={{ color: selectedColor || community?.color || "#6366f1" }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{communityName || community?.nombre || "Tu comunidad"}</p>
              <p className="text-xs text-muted-foreground">
                Codigo: <span className="font-mono font-bold" style={{ color: selectedColor || community?.color || "#6366f1" }}>{community?.codigo || "N/A"}</span>
                {" | "}
                {members.length} miembro{members.length !== 1 ? "s" : ""}
                {" | "}
                Trial: {trialDays || community?.free_trial_days || 7} dias
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Permissions */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              Accesos de los Miembros
            </CardTitle>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              {enabledCount} de {permissions.length} activos
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Controla que secciones pueden ver y usar los miembros de tu comunidad
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {permissions.map((perm) => (
              <button
                key={perm.id}
                onClick={() => togglePermission(perm.id)}
                className={cn(
                  "flex items-start gap-3 rounded-xl border p-4 text-left transition-all",
                  perm.enabled
                    ? "border-primary/20 bg-primary/5"
                    : "border-border/30 bg-card/30 hover:border-border/60"
                )}
              >
                <div className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg shrink-0 transition-all",
                  perm.enabled ? "bg-primary/10" : "bg-secondary/50"
                )}>
                  <perm.icon className={cn("h-4 w-4", perm.enabled ? "text-primary" : "text-muted-foreground/50")} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={cn("text-sm font-semibold", perm.enabled ? "text-foreground" : "text-muted-foreground")}>
                      {perm.label}
                    </p>
                    {perm.enabled ? (
                      <Eye className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{perm.description}</p>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview of member sidebar */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Eye className="h-4 w-4 text-primary" />
            Vista previa del menu del miembro
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Asi se vera el menu lateral para los miembros de tu comunidad
          </p>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs rounded-xl border border-border/30 bg-secondary/20 p-3">
            <div className="space-y-1">
              {/* Always visible items */}
              <div className="flex items-center gap-2.5 rounded-lg bg-primary/10 px-3 py-2">
                <div className="h-4 w-4 rounded bg-primary/20" />
                <span className="text-xs font-medium text-primary">Dashboard</span>
              </div>

              {permissions.filter(p => p.enabled).map((perm) => (
                <div key={perm.id} className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground hover:bg-secondary/50 transition-colors">
                  <perm.icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{perm.label}</span>
                </div>
              ))}

              {/* Always visible items */}
              <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground">
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Perfil</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-muted-foreground">
                <Settings className="h-4 w-4" />
                <span className="text-xs font-medium">Suscripcion</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
