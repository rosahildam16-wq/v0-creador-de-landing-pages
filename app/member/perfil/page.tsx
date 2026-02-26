"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getMemberData } from "@/lib/team-data"
import { EMBUDOS } from "@/lib/embudos-config"
import { User, Mail, Shield, Calendar, Filter, Lock, Save, Check, Trophy, CreditCard, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { useSearchParams } from "next/navigation"

export default function MemberPerfilPage() {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const member = getMemberData(user)

  // Initialize tab from URL if present
  const initialTab = searchParams.get("tab") as "perfil" | "suscripcion" | "config"
  const [activeTab, setActiveTab] = useState<"perfil" | "suscripcion" | "config">(initialTab || "perfil")
  const [saved, setSaved] = useState(false)
  const [nombre, setNombre] = useState(member?.nombre || user?.name || "")
  const [email] = useState(member?.email || user?.email || "")

  if (!member || !user) return null

  const embudosActivos = EMBUDOS.filter((e) => member.embudos_asignados?.includes(e.id))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Ajustes de Cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona tu informacion personal y configuracion</p>
        </div>
        <div className="flex items-center bg-secondary/40 p-1 rounded-xl border border-border/10">
          <button
            onClick={() => setActiveTab("perfil")}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              activeTab === "perfil" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Perfil
          </button>
          <button
            onClick={() => setActiveTab("suscripcion")}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              activeTab === "suscripcion" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Suscripcion
          </button>
          <button
            onClick={() => setActiveTab("config")}
            className={cn(
              "px-4 py-1.5 text-xs font-bold rounded-lg transition-all",
              activeTab === "config" ? "bg-primary text-primary-foreground shadow-lg" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Ajustes
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">

          {activeTab === "perfil" && (
            <>
              {/* Avatar + Info */}
              <div className="overflow-hidden rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm shadow-sm">
                <div className="relative h-32 bg-gradient-to-r from-primary/30 via-primary/10 to-transparent">
                  <div className="absolute inset-0 bg-grid-white/[0.05]" />
                </div>
                <div className="px-6 pb-6">
                  <div className="-mt-12 flex items-end gap-6">
                    <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-card bg-gradient-to-br from-primary to-accent text-3xl font-bold text-primary-foreground shadow-2xl">
                      {member.avatar_initials}
                    </div>
                    <div className="mb-2 flex flex-col">
                      <span className="text-2xl font-bold text-foreground">{member.nombre}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">Socio VIP</Badge>
                        <span className="text-xs text-muted-foreground">{member.email}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Personal Info Form */}
              <Card className="border-border/30 bg-card/40 backdrop-blur-sm">
                <CardContent className="p-6">
                  <h2 className="mb-6 text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Datos del socio
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Nombre Completo</label>
                      <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className="w-full rounded-xl border border-border/40 bg-background/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Email de usuario</label>
                      <input
                        type="email"
                        value={email}
                        disabled
                        className="w-full rounded-xl border border-border/20 bg-secondary/30 px-4 py-3 text-sm text-muted-foreground font-medium cursor-not-allowed"
                      />
                    </div>
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={handleSave}
                      className="flex items-center gap-2 rounded-xl bg-primary px-8 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                    >
                      {saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
                      {saved ? "Guardado" : "Actualizar Perfil"}
                    </button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}

          {activeTab === "suscripcion" && (
            <div className="space-y-6 animate-in fade-in duration-400">
              <Card className="border-primary/20 bg-primary/5 shadow-2xl shadow-primary/5 overlow-hidden relative">
                <div className="absolute top-0 right-0 p-6">
                  <Shield className="h-20 w-20 text-primary/5 rotate-12" />
                </div>
                <CardContent className="p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="h-14 w-14 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
                      <Shield className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-foreground">Socio Elite</h3>
                      <p className="text-sm text-primary font-bold">¡Tienes acceso a todo!</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
                    <div className="p-4 rounded-2xl bg-background/40 border border-border/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Estado</p>
                      <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        Activo
                      </span>
                    </div>
                    <div className="p-4 rounded-2xl bg-background/40 border border-border/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Próximo Cobro</p>
                      <span className="text-sm font-bold text-foreground">{member.fecha_renovacion || '22 Mar 2026'}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-background/40 border border-border/10">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Método de Pago</p>
                      <span className="text-sm font-bold text-foreground flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                        Visa **** 4242
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button className="flex-1 rounded-xl bg-foreground text-background font-bold py-3 text-sm hover:opacity-90 transition-opacity">
                      Cambiar Plan
                    </button>
                    <button className="flex-1 rounded-xl border border-border/40 bg-card/40 text-foreground font-bold py-3 text-sm hover:bg-card/70 transition-colors">
                      Ver Facturas
                    </button>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-emerald-500/5 border-emerald-500/20">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <Trophy className="h-5 w-5 text-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground italic">¡Nivel Diamante!</h4>
                      <p className="text-[10px] text-muted-foreground">Tu cuenta tiene todos los beneficios activos.</p>
                    </div>
                  </CardContent>
                </Card>
                <Card className="bg-amber-500/5 border-amber-500/20">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <Zap className="h-5 w-5 text-amber-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">Soporte Prioritario</h4>
                      <p className="text-[10px] text-muted-foreground">Respuesta en menos de 2 horas garantizada.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === "config" && (
            <div className="animate-in fade-in duration-400 space-y-6">
              <Card className="border-border/30 bg-card/40">
                <CardContent className="p-6">
                  <h2 className="mb-6 text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <Lock className="h-4 w-4 text-primary" /> Seguridad
                  </h2>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Nueva Contraseña</label>
                      <input type="password" placeholder="Mínimo 8 caracteres" className="w-full rounded-xl border border-border/40 bg-background/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase">Confirmar Contraseña</label>
                      <input type="password" placeholder="Repite la contraseña" className="w-full rounded-xl border border-border/40 bg-background/40 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                    <button onClick={handleSave} className="w-full rounded-xl bg-secondary py-3 text-sm font-bold text-foreground hover:bg-secondary/80 transition-colors">
                      {saved ? "¡Cambios guardados!" : "Actualizar Seguridad"}
                    </button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-red-500/10 bg-red-500/5">
                <CardContent className="p-6 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-red-500">Eliminar Cuenta</h3>
                    <p className="text-[11px] text-muted-foreground">Esta acción es permanente y no se puede deshacer.</p>
                  </div>
                  <button className="px-4 py-2 border border-red-500/20 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-all">
                    Borrar cuenta
                  </button>
                </CardContent>
              </Card>
            </div>
          )}

        </div>

        {/* Info Sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Member Since */}
          <div className="rounded-2xl border border-border/30 bg-card/60 p-6 backdrop-blur-sm shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Historial
            </h3>
            <div className="space-y-4">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Miembro desde</span>
                <span className="text-sm font-bold text-foreground">{member.fecha_ingreso}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">ID de Socio</span>
                <span className="text-sm font-bold text-foreground font-mono">{member.id}</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="rounded-2xl border border-border/30 bg-card/60 p-6 backdrop-blur-sm shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Leads totales</span>
              <span className="text-sm font-bold text-primary">{member.metricas.leads}</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary w-[70%]" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Conversión</span>
              <span className="text-sm font-bold text-emerald-400">12%</span>
            </div>
            <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-emerald-400 w-[45%]" />
            </div>
          </div>

          {/* Embudos List */}
          <div className="rounded-2xl border border-border/30 bg-card/60 p-6 backdrop-blur-sm shadow-sm">
            <h3 className="mb-4 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Filter className="h-3.5 w-3.5 text-primary" /> Herramientas
            </h3>
            <div className="space-y-2">
              {embudosActivos.map(e => (
                <div key={e.id} className="flex items-center gap-2 p-2 rounded-lg bg-background/30 hover:bg-background/50 transition-colors">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: e.color }} />
                  <span className="text-xs font-semibold text-foreground">{e.nombre}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
