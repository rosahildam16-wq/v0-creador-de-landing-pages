"use client"

import { useEffect, useState, useCallback } from "react"
import { toast } from "sonner"
import {
  UsersRound,
  Loader2,
  RefreshCw,
  Plus,
  Trash2,
  ShieldCheck,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminRole {
  id: string
  user_id: string
  role: string
  granted_by: string
  active: boolean
  revoked_at: string | null
  revoked_by: string | null
  created_at: string
}

const ROLE_LABELS: Record<string, string> = {
  super_admin:       "Super Admin",
  admin:             "Admin",
  finance_admin:     "Finance Admin",
  support_admin:     "Support Admin",
  compliance_admin:  "Compliance Admin",
}

const ROLE_COLORS: Record<string, string> = {
  super_admin:       "bg-red-500/10 text-red-400 border-red-500/20",
  admin:             "bg-blue-500/10 text-blue-400 border-blue-500/20",
  finance_admin:     "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  support_admin:     "bg-sky-500/10 text-sky-400 border-sky-500/20",
  compliance_admin:  "bg-amber-500/10 text-amber-400 border-amber-500/20",
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function RolesPage() {
  const [roles, setRoles] = useState<AdminRole[]>([])
  const [loading, setLoading] = useState(true)

  // Grant dialog
  const [grantOpen, setGrantOpen] = useState(false)
  const [grantUserId, setGrantUserId] = useState("")
  const [grantRole, setGrantRole] = useState<string>("admin")
  const [granting, setGranting] = useState(false)

  // Revoke dialog
  const [revokeTarget, setRevokeTarget] = useState<AdminRole | null>(null)
  const [revoking, setRevoking] = useState(false)

  // Filter
  const [filterActive, setFilterActive] = useState<"all" | "active" | "revoked">("active")

  const fetchRoles = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/roles")
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error al cargar roles"); return }
      setRoles(data.roles ?? [])
    } catch { toast.error("Error de conexión") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRoles() }, [fetchRoles])

  async function handleGrant() {
    if (!grantUserId.trim()) { toast.error("Ingresa el Member ID o email del usuario"); return }
    setGranting(true)
    try {
      const res = await fetch("/api/admin/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: grantUserId.trim(), role: grantRole }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error al otorgar rol"); return }
      toast.success(`Rol ${ROLE_LABELS[grantRole]} otorgado correctamente`)
      setGrantOpen(false)
      setGrantUserId("")
      setGrantRole("admin")
      fetchRoles()
    } catch { toast.error("Error de conexión") }
    finally { setGranting(false) }
  }

  async function handleRevoke() {
    if (!revokeTarget) return
    setRevoking(true)
    try {
      const res = await fetch(`/api/admin/roles/${revokeTarget.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error al revocar rol"); return }
      toast.success(`Rol de ${revokeTarget.user_id} revocado`)
      setRevokeTarget(null)
      fetchRoles()
    } catch { toast.error("Error de conexión") }
    finally { setRevoking(false) }
  }

  const filtered = roles.filter((r) => {
    if (filterActive === "active") return r.active
    if (filterActive === "revoked") return !r.active
    return true
  })

  const activeCount  = roles.filter((r) => r.active).length
  const revokedCount = roles.filter((r) => !r.active).length

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
            <UsersRound className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Roles Admin</h1>
            <p className="text-sm text-muted-foreground">
              Gestión de roles de administrador — solo super_admin
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRoles}
            disabled={loading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button size="sm" className="gap-2" onClick={() => setGrantOpen(true)}>
            <Plus className="h-4 w-4" />
            Otorgar rol
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Roles activos</p>
            <p className="text-2xl font-bold text-foreground mt-1">{activeCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Roles revocados</p>
            <p className="text-2xl font-bold text-muted-foreground mt-1">{revokedCount}</p>
          </CardContent>
        </Card>
        <Card className="border-border/50 border-red-500/20">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Super Admins activos</p>
            <p className="text-2xl font-bold text-red-400 mt-1">
              {roles.filter((r) => r.active && r.role === "super_admin").length}
              <span className="text-xs text-muted-foreground font-normal ml-1">/ 2 máx</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(["active", "all", "revoked"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterActive(f)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              filterActive === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            }`}
          >
            {f === "active" ? "Activos" : f === "revoked" ? "Revocados" : "Todos"}
          </button>
        ))}
      </div>

      {/* Roles table */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            {filterActive === "active" ? "Administradores activos" : filterActive === "revoked" ? "Historial revocados" : "Todos los roles"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              {filterActive === "active" ? "No hay administradores activos" : "Sin registros"}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/30">
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Usuario</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Rol</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Otorgado por</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-b border-border/20 hover:bg-secondary/20 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-foreground/80">{r.user_id}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${ROLE_COLORS[r.role] ?? "bg-secondary text-foreground"}`}>
                          {ROLE_LABELS[r.role] ?? r.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{r.granted_by}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3">
                        {r.active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
                            <ShieldCheck className="h-3 w-3" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary border border-border/30 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            <Clock className="h-3 w-3" /> Revocado
                          </span>
                        )}
                        {!r.active && r.revoked_at && (
                          <p className="mt-0.5 text-[10px] text-muted-foreground">
                            {new Date(r.revoked_at).toLocaleDateString("es-MX")}
                            {r.revoked_by && ` · por ${r.revoked_by}`}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {r.active && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 gap-1.5 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => setRevokeTarget(r)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Revocar
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Grant role dialog */}
      <Dialog open={grantOpen} onOpenChange={setGrantOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Otorgar rol de administrador
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-400">
              Asignar un rol admin otorga acceso elevado al panel de administración. Solo
              super_admin puede realizar esta acción. Máximo 2 super_admin activos.
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Member ID o email del usuario</Label>
              <Input
                placeholder="member-uuid o usuario@email.com"
                value={grantUserId}
                onChange={(e) => setGrantUserId(e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Rol a otorgar</Label>
              <select
                value={grantRole}
                onChange={(e) => setGrantRole(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantOpen(false)} disabled={granting}>
              Cancelar
            </Button>
            <Button onClick={handleGrant} disabled={granting || !grantUserId.trim()} className="gap-2">
              {granting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Otorgar rol
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Revoke confirmation dialog */}
      <Dialog open={!!revokeTarget} onOpenChange={(open) => !open && setRevokeTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <Trash2 className="h-4 w-4" />
              Revocar rol de administrador
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-muted-foreground">
              Estás a punto de revocar el rol{" "}
              <span className="font-semibold text-foreground">
                {revokeTarget ? ROLE_LABELS[revokeTarget.role] ?? revokeTarget.role : ""}
              </span>{" "}
              del usuario{" "}
              <span className="font-mono text-foreground">{revokeTarget?.user_id}</span>.
            </p>
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
              Esta acción eliminará el acceso admin inmediatamente. El historial se conserva (soft delete).
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRevokeTarget(null)} disabled={revoking}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleRevoke} disabled={revoking} className="gap-2">
              {revoking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              Revocar acceso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
