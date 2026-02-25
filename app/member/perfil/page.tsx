"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getTeamMemberById } from "@/lib/team-data"
import { EMBUDOS } from "@/lib/embudos-config"
import { User, Mail, Shield, Calendar, Funnel, Lock, Save, Check } from "lucide-react"

export default function MemberPerfilPage() {
  const { user } = useAuth()
  const member = user?.memberId ? getTeamMemberById(user.memberId) : null
  const [saved, setSaved] = useState(false)
  const [nombre, setNombre] = useState(member?.nombre || user?.name || "")
  const [email] = useState(member?.email || user?.email || "")

  if (!member || !user) return null

  const embudosActivos = EMBUDOS.filter((e) => member.embudos_asignados.includes(e.id))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Mi perfil</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestiona tu informacion personal y configuracion</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Profile card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Avatar + Info */}
          <div className="overflow-hidden rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm">
            <div className="relative h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
            <div className="px-6 pb-6">
              <div className="-mt-10 flex items-end gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-primary/80 to-primary text-2xl font-bold text-primary-foreground shadow-lg">
                  {member.avatar_initials}
                </div>
                <div className="mb-1 flex flex-col">
                  <span className="text-lg font-bold text-foreground">{member.nombre}</span>
                  <span className="text-sm text-muted-foreground">{member.email}</span>
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
                  <Mail className="h-3.5 w-3.5 text-primary" />
                  Email
                </label>
                <input
                  type="email"
                  value={email}
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
          {/* Plan */}
          <div className="rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Shield className="h-4 w-4 text-primary" />
              Mi plan
            </h3>
            <div className="rounded-xl bg-primary/10 px-4 py-3">
              <span className="text-lg font-bold text-primary">Plan Activo</span>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {member.fecha_renovacion
                  ? `Renueva: ${member.fecha_renovacion}`
                  : "Sin fecha de renovacion"}
              </p>
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
                <span className="text-muted-foreground">Miembro desde</span>
                <span className="font-medium text-foreground">{member.fecha_ingreso}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Leads totales</span>
                <span className="font-medium text-foreground">{member.metricas.leads}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Cerrados</span>
                <span className="font-medium text-foreground">{member.metricas.cerrados}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Afiliados</span>
                <span className="font-medium text-foreground">{member.metricas.afiliados}</span>
              </div>
            </div>
          </div>

          {/* Embudos */}
          <div className="rounded-2xl border border-border/30 bg-card/60 p-5 backdrop-blur-sm">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Funnel className="h-4 w-4 text-primary" />
              Mis embudos
            </h3>
            {embudosActivos.length > 0 ? (
              <div className="space-y-2">
                {embudosActivos.map((e) => (
                  <div key={e.id} className="flex items-center gap-2 rounded-lg bg-background/40 px-3 py-2">
                    <div className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                    <span className="text-sm text-foreground">{e.nombre}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No tienes embudos asignados</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
