"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Search, Eye, EyeOff, Copy, Check, KeyRound, Shield,
  Users, RefreshCw, ChevronDown, Trash2, Plus, X,
  Snowflake, Flame, Lock, UserX, AlertCircle, Loader2, ArrowUpDown,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog"
import { PLAN_OPTIONS, normalizePlanCode, type PlanCode } from "@/lib/plans"

// ─── Types ────────────────────────────────────────────────────────────────────

interface AdminUser {
  id: number
  memberId: string
  name: string
  username: string
  email: string
  password?: string
  role: string
  communityId: string
  sponsorUsername: string | null
  activo: boolean
  frozen_at?: string | null
  trialEndsAt: string | null
  createdAt: string
  planCode: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function roleLabel(role: string) {
  if (role === "super_admin") return { text: "Super Admin", cls: "bg-amber-500/10 text-amber-500 border-amber-500/20" }
  if (role === "admin")       return { text: "Admin",       cls: "bg-purple-500/10 text-purple-400 border-purple-500/20" }
  return                             { text: "Miembro",     cls: "bg-primary/10 text-primary border-primary/20" }
}

function planLabel(code: string) {
  switch (normalizePlanCode(code)) {
    case "300": return { text: "Enterprise $300", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20" }
    case "97":  return { text: "Pro $97",         cls: "bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20" }
    case "47":  return { text: "Growth $47",      cls: "bg-violet-500/10 text-violet-400 border-violet-500/20" }
    default:    return { text: "Starter $27",     cls: "bg-slate-500/10 text-slate-400 border-slate-500/20" }
  }
}

const trialActive = (d: string | null) => !!d && new Date(d) > new Date()
const fmtDate     = (iso: string) => new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" })

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminUsuariosPage() {
  const { user } = useAuth()

  const [users, setUsers]     = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState("")

  // Password visibility per user
  const [visiblePw, setVisiblePw]   = useState<Set<number>>(new Set())
  const [copiedId, setCopiedId]     = useState<number | null>(null)

  // Freeze/unfreeze dialog
  const [freezeDialog, setFreezeDialog] = useState<{
    open: boolean; user: AdminUser | null; action: "freeze" | "unfreeze"; reason: string; loading: boolean
  }>({ open: false, user: null, action: "freeze", reason: "", loading: false })

  // Delete dialog
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; user: AdminUser | null; loading: boolean }>({
    open: false, user: null, loading: false,
  })

  // Plan upgrade dialog
  const [planDialog, setPlanDialog] = useState<{
    open: boolean; user: AdminUser | null; selectedPlan: PlanCode; loading: boolean
  }>({ open: false, user: null, selectedPlan: "27", loading: false })

  // Add user modal
  const [addOpen, setAddOpen]   = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "", email: "", username: "", password: "", role: "member", communityId: "general",
  })

  // ── Data load ────────────────────────────────────────────────────────────
  async function fetchUsers() {
    setLoading(true)
    try {
      const res  = await fetch("/api/admin/users")
      const data = await res.json()
      if (data.users) setUsers(data.users)
      else toast.error(data.error ?? "Error al cargar usuarios")
    } catch { toast.error("Error de conexión") }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchUsers() }, [])

  // ── Freeze account ───────────────────────────────────────────────────────
  async function handleFreeze() {
    const { user: target, action, reason } = freezeDialog
    if (!target) return
    if (action === "freeze" && !reason.trim()) {
      toast.error("Debes indicar el motivo para congelar la cuenta"); return
    }
    setFreezeDialog((d) => ({ ...d, loading: true }))
    try {
      const res = await fetch(`/api/admin/users/${target.memberId}/freeze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, reason }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error"); return }
      toast.success(action === "freeze" ? "Cuenta congelada" : "Cuenta descongelada")
      setFreezeDialog({ open: false, user: null, action: "freeze", reason: "", loading: false })
      fetchUsers()
    } catch { toast.error("Error de conexión") }
    finally { setFreezeDialog((d) => ({ ...d, loading: false })) }
  }

  // ── Delete user ──────────────────────────────────────────────────────────
  async function handleDelete() {
    const target = deleteDialog.user
    if (!target) return
    setDeleteDialog((d) => ({ ...d, loading: true }))
    try {
      const res = await fetch(`/api/admin/users?id=${target.id}`, { method: "DELETE" })
      const data = await res.json()
      if (data.success) {
        toast.success("Usuario eliminado")
        setDeleteDialog({ open: false, user: null, loading: false })
        fetchUsers()
      } else { toast.error(data.error ?? "Error al eliminar") }
    } catch { toast.error("Error de conexión") }
    finally { setDeleteDialog((d) => ({ ...d, loading: false })) }
  }

  // ── Create user ──────────────────────────────────────────────────────────
  async function handleCreateUser(e: React.FormEvent) {
    e.preventDefault()
    setAddLoading(true)
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userData: newUser }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Usuario creado")
        setAddOpen(false)
        setNewUser({ name: "", email: "", username: "", password: "", role: "member", communityId: "general" })
        fetchUsers()
      } else { toast.error(data.error ?? "Error al crear") }
    } catch { toast.error("Error de conexión") }
    finally { setAddLoading(false) }
  }

  // ── Validate (activate) user ─────────────────────────────────────────────
  async function handleValidate(target: AdminUser) {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id, updates: { activo: true, community_id: "skalia-vip" } }),
      })
      if (res.ok) { toast.success(`${target.name} validado en Skalia VIP`); fetchUsers() }
      else { const d = await res.json(); toast.error(d.error ?? "Error") }
    } catch { toast.error("Error de conexión") }
  }

  // ── Plan upgrade ─────────────────────────────────────────────────────────
  function openPlanDialog(target: AdminUser) {
    const currentPlan = normalizePlanCode(target.planCode) as PlanCode
    setPlanDialog({ open: true, user: target, selectedPlan: currentPlan, loading: false })
  }

  async function handlePlanUpgrade() {
    const { user: target, selectedPlan } = planDialog
    if (!target) return

    const currentPlan = normalizePlanCode(target.planCode)
    if (selectedPlan === currentPlan) {
      toast.info("El usuario ya tiene ese plan"); return
    }

    setPlanDialog((d) => ({ ...d, loading: true }))
    try {
      const res = await fetch("/api/admin/users/plan", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: target.id, planCode: selectedPlan }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(data.message ?? `Plan actualizado a ${selectedPlan}`)
        setPlanDialog({ open: false, user: null, selectedPlan: "27", loading: false })
        fetchUsers()
      } else {
        toast.error(data.error ?? "Error al actualizar plan")
      }
    } catch { toast.error("Error de conexión") }
    finally { setPlanDialog((d) => ({ ...d, loading: false })) }
  }

  // ── Derived ──────────────────────────────────────────────────────────────
  const isSuperAdmin = user?.role === "super_admin"

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return !q
      || u.name.toLowerCase().includes(q)
      || u.email.toLowerCase().includes(q)
      || (u.username ?? "").toLowerCase().includes(q)
      || (u.memberId ?? "").toLowerCase().includes(q)
  })

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios y Soporte</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestión de cuentas, soporte técnico y acciones administrativas
          </p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Agregar Usuario
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border/30 bg-card/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{users.length}</p>
              <p className="text-xs text-muted-foreground">Total usuarios</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/30 bg-card/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
              <KeyRound className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{users.filter(u => u.activo).length}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border/30 bg-card/60 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10">
              <Snowflake className="h-5 w-5 text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {users.filter(u => u.frozen_at).length}
              </p>
              <p className="text-xs text-muted-foreground">Congelados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, email, username o ID..."
            className="w-full rounded-xl border border-border/40 bg-background/60 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
          />
        </div>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="flex items-center gap-2 rounded-xl border border-border/40 bg-background/60 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/50 disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="mb-3 h-10 w-10 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="px-4 py-3 font-medium text-muted-foreground">Usuario</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Email</th>
                  {isSuperAdmin && (
                    <th className="px-4 py-3 font-medium text-muted-foreground">Contraseña</th>
                  )}
                  <th className="px-4 py-3 font-medium text-muted-foreground">Plan</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Rol</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Estado</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Lock className="h-3 w-3 text-amber-400" />
                      Sponsor
                    </span>
                  </th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Trial</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Registro</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const isFrozen  = !!u.frozen_at
                  const rl        = roleLabel(u.role)
                  const pl        = planLabel(u.planCode)
                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-border/10 transition-colors hover:bg-secondary/20 ${isFrozen ? "opacity-60" : ""}`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {isFrozen && <Snowflake className="h-3 w-3 text-sky-400 shrink-0" />}
                          <div>
                            <p className="font-medium text-foreground">{u.name}</p>
                            {u.username && (
                              <p className="text-xs text-muted-foreground font-mono">@{u.username}</p>
                            )}
                            <p className="text-[10px] text-muted-foreground/50 font-mono">{u.memberId}</p>
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 text-muted-foreground">{u.email}</td>

                      {/* Password — super_admin only */}
                      {isSuperAdmin && (
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <code className="rounded bg-secondary/60 px-2 py-1 text-xs font-mono">
                              {visiblePw.has(u.id) ? (u.password ?? "N/A") : "••••••••"}
                            </code>
                            <button
                              onClick={() => setVisiblePw((p) => { const n = new Set(p); n.has(u.id) ? n.delete(u.id) : n.add(u.id); return n })}
                              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              {visiblePw.has(u.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                            </button>
                            <button
                              onClick={() => { navigator.clipboard.writeText(u.password ?? ""); setCopiedId(u.id); setTimeout(() => setCopiedId(null), 2000) }}
                              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                              {copiedId === u.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                            </button>
                          </div>
                        </td>
                      )}

                      {/* Plan */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${pl.cls}`}>
                            {pl.text}
                          </span>
                          {isSuperAdmin && (
                            <button
                              onClick={() => openPlanDialog(u)}
                              className="rounded-md p-1 text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors"
                              title="Cambiar plan"
                            >
                              <ArrowUpDown className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold ${rl.cls}`}>
                          {rl.text}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        {isFrozen ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/30 bg-sky-500/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
                            <Snowflake className="h-2.5 w-2.5" />
                            Congelado
                          </span>
                        ) : u.activo ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full border border-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                            Inactivo
                          </span>
                        )}
                      </td>

                      {/* Sponsor — locked by compliance */}
                      <td className="px-4 py-3">
                        {u.sponsorUsername ? (
                          <div>
                            <p className="text-xs text-muted-foreground">@{u.sponsorUsername}</p>
                            <p className="text-[9px] text-amber-500/70 flex items-center gap-0.5 mt-0.5">
                              <Lock className="h-2 w-2" />
                              locked by compliance
                            </p>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground/50">—</span>
                        )}
                      </td>

                      {/* Trial */}
                      <td className="px-4 py-3">
                        {u.trialEndsAt ? (
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            trialActive(u.trialEndsAt)
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-destructive/10 text-destructive"
                          }`}>
                            {trialActive(u.trialEndsAt) ? "Activo" : "Vencido"}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>

                      {/* Created at */}
                      <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(u.createdAt)}</td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Validate */}
                          {!u.activo && u.communityId !== "skalia-vip" && (
                            <button
                              onClick={() => handleValidate(u)}
                              className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                            >
                              VALIDAR
                            </button>
                          )}
                          {u.activo && u.communityId === "skalia-vip" && !isFrozen && (
                            <span className="text-[9px] font-bold text-muted-foreground bg-white/5 px-2 py-0.5 rounded">VALIDADO</span>
                          )}

                          {/* Freeze / Unfreeze */}
                          {isFrozen ? (
                            <button
                              onClick={() => setFreezeDialog({ open: true, user: u, action: "unfreeze", reason: "", loading: false })}
                              className="rounded-md p-1.5 text-sky-400 hover:bg-sky-500/10 transition-colors"
                              title="Descongelar cuenta"
                            >
                              <Flame className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => setFreezeDialog({ open: true, user: u, action: "freeze", reason: "", loading: false })}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-sky-500/10 hover:text-sky-400 transition-colors"
                              title="Congelar cuenta"
                            >
                              <Snowflake className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Delete */}
                          {isSuperAdmin && (
                            <button
                              onClick={() => setDeleteDialog({ open: true, user: u, loading: false })}
                              className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                              title="Eliminar usuario"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Plan Upgrade Dialog ────────────────────────────────────────────── */}
      <Dialog
        open={planDialog.open}
        onOpenChange={(o) => !planDialog.loading && setPlanDialog((d) => ({ ...d, open: o }))}
      >
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle className="text-primary">Cambiar plan</DialogTitle>
            {planDialog.user && (
              <DialogDescription>
                <strong>{planDialog.user.name}</strong> — {planDialog.user.email}
                <br />
                <span className="text-xs">Plan actual: <strong>{planLabel(planDialog.user.planCode).text}</strong></span>
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label>Selecciona el nuevo plan</Label>
            <div className="grid grid-cols-2 gap-2">
              {PLAN_OPTIONS.map((opt) => (
                <button
                  key={opt.code}
                  onClick={() => setPlanDialog((d) => ({ ...d, selectedPlan: opt.code }))}
                  className={`rounded-xl border px-4 py-3 text-left transition-all ${
                    planDialog.selectedPlan === opt.code
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border/40 bg-background/60 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  <p className="text-sm font-bold">${opt.price}</p>
                  <p className="text-xs">{opt.label.split("—")[0].trim()}</p>
                </button>
              ))}
            </div>

            {planDialog.user && planDialog.selectedPlan !== normalizePlanCode(planDialog.user.planCode) && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
                El plan se cambiará de <strong>{planLabel(planDialog.user.planCode).text}</strong> a{" "}
                <strong>{planLabel(planDialog.selectedPlan).text}</strong>.
                Los permisos se actualizarán en el próximo inicio de página del usuario.
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPlanDialog({ open: false, user: null, selectedPlan: "27", loading: false })}
              disabled={planDialog.loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handlePlanUpgrade}
              disabled={planDialog.loading || (planDialog.user ? planDialog.selectedPlan === normalizePlanCode(planDialog.user.planCode) : true)}
            >
              {planDialog.loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Guardando...</>
                : "Guardar cambios"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Freeze/Unfreeze Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={freezeDialog.open}
        onOpenChange={(o) => !freezeDialog.loading && setFreezeDialog((d) => ({ ...d, open: o }))}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className={freezeDialog.action === "freeze" ? "text-sky-400" : "text-emerald-400"}>
              {freezeDialog.action === "freeze" ? "Congelar cuenta" : "Descongelar cuenta"}
            </DialogTitle>
            {freezeDialog.user && (
              <DialogDescription>
                {freezeDialog.user.name} ({freezeDialog.user.email})
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="space-y-3 py-2">
            {freezeDialog.action === "freeze" && (
              <div className="space-y-2">
                <Label>Motivo <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="Ej: Actividad sospechosa detectada por compliance..."
                  value={freezeDialog.reason}
                  onChange={(e) => setFreezeDialog((d) => ({ ...d, reason: e.target.value }))}
                />
                {!freezeDialog.reason.trim() && (
                  <p className="flex items-center gap-1 text-xs text-destructive">
                    <AlertCircle className="h-3 w-3" /> Obligatorio para congelar
                  </p>
                )}
              </div>
            )}
            <div className={`rounded-lg border p-3 text-xs ${
              freezeDialog.action === "freeze"
                ? "border-sky-500/20 bg-sky-500/5 text-sky-400"
                : "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
            }`}>
              {freezeDialog.action === "freeze"
                ? "El usuario no podrá acceder a la plataforma. Acción registrada en auditoría."
                : "El usuario recuperará acceso inmediatamente. Acción registrada en auditoría."
              }
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFreezeDialog({ open: false, user: null, action: "freeze", reason: "", loading: false })}>
              Cancelar
            </Button>
            <Button
              onClick={handleFreeze}
              disabled={freezeDialog.loading || (freezeDialog.action === "freeze" && !freezeDialog.reason.trim())}
              variant={freezeDialog.action === "freeze" ? "destructive" : "default"}
            >
              {freezeDialog.loading
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Procesando...</>
                : freezeDialog.action === "freeze" ? "Congelar cuenta" : "Descongelar cuenta"
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Dialog ─────────────────────────────────────────────────── */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(o) => !deleteDialog.loading && setDeleteDialog((d) => ({ ...d, open: o }))}
      >
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="text-destructive">Eliminar usuario</DialogTitle>
            {deleteDialog.user && (
              <DialogDescription>
                Esta acción eliminará permanentemente a <strong>{deleteDialog.user.name}</strong> y todos sus datos. Esta acción es irreversible.
              </DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDeleteDialog({ open: false, user: null, loading: false })}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteDialog.loading}>
              {deleteDialog.loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Eliminar permanentemente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add User Modal ────────────────────────────────────────────────── */}
      {addOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Agregar Usuario</h2>
              <button onClick={() => setAddOpen(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre Completo</label>
                <input required type="text" value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary/50" placeholder="Juan Pérez" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input required type="email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary/50" placeholder="juan@ejemplo.com" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <input required type="text" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary/50" placeholder="juan123" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contraseña</label>
                  <input required type="text" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary/50" placeholder="Min 6 caracteres" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Comunidad ID</label>
                <input type="text" value={newUser.communityId} onChange={e => setNewUser({ ...newUser, communityId: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary/50" placeholder="general" />
              </div>
              <button type="submit" disabled={addLoading}
                className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground hover:opacity-90 active:scale-95 disabled:opacity-50">
                {addLoading ? "Creando..." : "Crear Usuario"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Compliance notice */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-xs text-amber-500/80">
          <strong>Compliance:</strong> El campo Sponsor es permanente e inmutable (locked by compliance). Las contraseñas solo son visibles para super_admin.
          Todas las acciones de freeze/unfreeze y cambio de plan quedan registradas en el log de auditoría.
        </p>
      </div>
    </div>
  )
}
