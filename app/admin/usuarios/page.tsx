"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Search, Eye, EyeOff, Copy, Check, KeyRound, Shield, Users, RefreshCw, ChevronDown, Trash2, Plus, X } from "lucide-react"
import { toast } from "sonner"

interface AdminUser {
  id: number
  memberId: string
  name: string
  username: string
  email: string
  password: string
  role: string
  communityId: string
  sponsorUsername: string | null
  activo: boolean
  trialEndsAt: string | null
  createdAt: string
}

export default function AdminUsuariosPage() {
  const { user } = useAuth()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<"all" | "member">("all")
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set())
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    role: "member",
    communityId: "general"
  })

  const fetchUsers = async () => {
    if (!user?.email) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(user.email)}`)
      const data = await res.json()
      if (data.users) setUsers(data.users)
    } catch { /* noop */ }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [user?.email])

  const togglePassword = (id: number) => {
    setVisiblePasswords(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const copyPassword = (id: number, pw: string) => {
    navigator.clipboard.writeText(pw)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = async (userId: number, username: string) => {
    if (!user?.email) return
    if (!confirm(`¿Estás seguro de que deseas eliminar al usuario @${username}? Esta acción borrará también sus datos relacionados.`)) return

    try {
      const res = await fetch(`/api/admin/users?email=${encodeURIComponent(user.email)}&id=${userId}`, {
        method: "DELETE"
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Usuario eliminado correctamente")
        fetchUsers()
      } else {
        toast.error(data.error || "Error al eliminar")
      }
    } catch (err) {
      toast.error("Error de conexion")
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user?.email) return
    setIsSubmitting(true)

    try {
      const res = await fetch(`/api/admin/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adminEmail: user.email,
          userData: newUser
        })
      })
      const data = await res.json()
      if (data.success) {
        toast.success("Usuario creado")
        setIsAddModalOpen(false)
        setNewUser({
          name: "",
          email: "",
          username: "",
          password: "",
          role: "member",
          communityId: "general"
        })
        fetchUsers()
      } else {
        toast.error(data.error || "Error al crear")
      }
    } catch (err) {
      toast.error("Error de conexion")
    } finally {
      setIsSubmitting(false)
    }
  }

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.username || "").toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "all" || u.role === roleFilter
    return matchSearch && matchRole
  })

  const members = users.filter(u => u.role !== "super_admin")

  const trialActive = (dateStr: string | null) => {
    if (!dateStr) return false
    return new Date(dateStr) > new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Usuarios y Soporte</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gestiona credenciales de todos los usuarios para soporte tecnico</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
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
              <p className="text-2xl font-bold text-foreground">{members.length}</p>
              <p className="text-xs text-muted-foreground">Miembros</p>
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
            placeholder="Buscar por nombre, email o username..."
            className="w-full rounded-xl border border-border/40 bg-background/60 py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
          />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as "all" | "member")}
              className="appearance-none rounded-xl border border-border/40 bg-background/60 py-2.5 pl-4 pr-10 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
            >
              <option value="all">Todos los roles</option>
              <option value="member">Miembros</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
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
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-border/30 bg-card/60 backdrop-blur-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              <p className="text-sm text-muted-foreground">Cargando usuarios...</p>
            </div>
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
                  <th className="px-4 py-3 font-medium text-muted-foreground">Contrasena</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Rol</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Comunidad</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Patrocinador</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Trial</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Registro</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground text-right pr-6">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} className="border-b border-border/10 transition-colors hover:bg-secondary/20">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-foreground">{u.name}</p>
                        {u.username && (
                          <p className="text-xs text-muted-foreground font-mono">@{u.username}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{u.email}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <code className="rounded bg-secondary/60 px-2 py-1 text-xs font-mono">
                          {visiblePasswords.has(u.id) ? u.password : "••••••••"}
                        </code>
                        <button
                          onClick={() => togglePassword(u.id)}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          title={visiblePasswords.has(u.id) ? "Ocultar" : "Mostrar"}
                        >
                          {visiblePasswords.has(u.id) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => copyPassword(u.id, u.password)}
                          className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                          title="Copiar contrasena"
                        >
                          {copiedId === u.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${roleLabel(u.role).class
                        }`}>
                        {roleLabel(u.role).text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{u.communityId}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.sponsorUsername ? `@${u.sponsorUsername}` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {u.trialEndsAt ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${trialActive(u.trialEndsAt)
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "bg-destructive/10 text-destructive"
                          }`}>
                          {trialActive(u.trialEndsAt) ? "Activo" : "Vencido"}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.createdAt).toLocaleDateString("es-ES", { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {!u.activo || u.communityId !== 'skalia-vip' ? (
                          <button
                            onClick={async () => {
                              if (!user?.email) return
                              try {
                                const res = await fetch('/api/admin/users', {
                                  method: 'PATCH',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    adminEmail: user.email,
                                    userId: u.id,
                                    updates: { activo: true, community_id: 'skalia-vip' }
                                  })
                                })
                                if (res.ok) {
                                  toast.success(`${u.name} validado en Skalia VIP`)
                                  fetchUsers()
                                }
                              } catch { toast.error('Error al validar') }
                            }}
                            className="rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-500 hover:bg-emerald-500/20 transition-all border border-emerald-500/20"
                            title="Validar y Activar en Skalia VIP"
                          >
                            VALIDAR
                          </button>
                        ) : (
                          <span className="text-[9px] font-bold text-muted-foreground uppercase bg-white/5 px-2 py-0.5 rounded">VALIDADO</span>
                        )}
                        <button
                          onClick={() => handleDelete(u.id, u.username)}
                          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          title="Eliminar usuario"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Agregar Nuevo Usuario</h2>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-2 text-muted-foreground hover:bg-secondary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Nombre Completo</label>
                <input
                  required
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary/50"
                  placeholder="Ej: Juan Perez"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <input
                  required
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary/50"
                  placeholder="juan@ejemplo.com"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Username</label>
                  <input
                    required
                    type="text"
                    value={newUser.username}
                    onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary/50"
                    placeholder="juan123"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Contrasena</label>
                  <input
                    required
                    type="text"
                    value={newUser.password}
                    onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary/50"
                    placeholder="Min 6 caracteres"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rol</label>
                  <select
                    value={newUser.role}
                    onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary/50"
                  >
                    <option value="member">Miembro</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Comunidad ID</label>
                  <input
                    type="text"
                    value={newUser.communityId}
                    onChange={e => setNewUser({ ...newUser, communityId: e.target.value })}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 outline-none focus:border-primary/50"
                    placeholder="general"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? "Creando..." : "Crear Usuario"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Security notice */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-xs text-amber-500/80">
          <strong>Nota de seguridad:</strong> Las contrasenas se muestran unicamente para soporte tecnico. Esta informacion es confidencial y solo visible para el super administrador.
        </p>
      </div>
    </div>
  )
}

function roleLabel(role: string) {
  if (role === "super_admin") return { text: "Admin", class: "bg-amber-500/10 text-amber-500" }
  return { text: "Miembro", class: "bg-primary/10 text-primary" }
}
