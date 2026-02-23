"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Search, Eye, EyeOff, Copy, Check, KeyRound, Shield, Users, RefreshCw, ChevronDown } from "lucide-react"

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
  const [roleFilter, setRoleFilter] = useState<"all" | "leader" | "member">("all")
  const [visiblePasswords, setVisiblePasswords] = useState<Set<number>>(new Set())
  const [copiedId, setCopiedId] = useState<number | null>(null)

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

  const filtered = users.filter(u => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      (u.username || "").toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === "all" || u.role === roleFilter
    return matchSearch && matchRole
  })

  const leaders = users.filter(u => u.role === "leader")
  const members = users.filter(u => u.role === "member")

  const trialActive = (dateStr: string | null) => {
    if (!dateStr) return false
    return new Date(dateStr) > new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Usuarios y Soporte</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gestiona credenciales de todos los usuarios para soporte tecnico</p>
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
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
              <Shield className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{leaders.length}</p>
              <p className="text-xs text-muted-foreground">Lideres</p>
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
              onChange={(e) => setRoleFilter(e.target.value as "all" | "leader" | "member")}
              className="appearance-none rounded-xl border border-border/40 bg-background/60 py-2.5 pl-4 pr-10 text-sm text-foreground outline-none transition-colors focus:border-primary/50"
            >
              <option value="all">Todos los roles</option>
              <option value="leader">Lideres</option>
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
            <table className="w-full text-left text-sm">
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
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        u.role === "leader"
                          ? "bg-amber-500/10 text-amber-500"
                          : "bg-primary/10 text-primary"
                      }`}>
                        {u.role === "leader" ? "Lider" : "Miembro"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground font-mono">{u.communityId}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {u.sponsorUsername ? `@${u.sponsorUsername}` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      {u.trialEndsAt ? (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          trialActive(u.trialEndsAt)
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
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString("es", { day: "2-digit", month: "short", year: "numeric" }) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Security notice */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
        <p className="text-xs text-amber-500/80">
          <strong>Nota de seguridad:</strong> Las contrasenas se muestran unicamente para soporte tecnico. Esta informacion es confidencial y solo visible para el super administrador.
        </p>
      </div>
    </div>
  )
}
