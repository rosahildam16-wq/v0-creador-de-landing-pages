"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  getAllCommunities,
  getCommunityMembers,
  getCommunityPosts,
  addCommunityPost,
  setMemberCommunity,
  removeMemberFromCommunity,
  type Community,
  type CommunityMember,
  type CommunityPost,
} from "@/lib/communities-data"
import { updateMemberFunnels } from "@/lib/team-data"
import { EMBUDOS } from "@/lib/embudos-config"
import { useAuth } from "@/lib/auth-context"
import {
  Users,
  Route,
  MessageSquare,
  Shield,
  Copy,
  Check,
  Send,
  UserX,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"

export default function AdminComunidadesPage() {
  const { user } = useAuth()
  const [communities, setCommunities] = useState<Community[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [newPostContent, setNewPostContent] = useState("")
  const [copiedCode, setCopiedCode] = useState(false)
  const [tab, setTab] = useState<"miembros" | "feed" | "config">("miembros")

  useEffect(() => {
    const all = getAllCommunities()
    setCommunities(all)
    if (all.length > 0 && !selectedId) {
      setSelectedId(all[0].id)
    }
  }, [selectedId])

  const selected = communities.find((c) => c.id === selectedId)

  useEffect(() => {
    if (!selectedId) return
    setMembers(getCommunityMembers(selectedId))
    setPosts(getCommunityPosts(selectedId))
  }, [selectedId])

  const refreshData = () => {
    if (!selectedId) return
    setMembers(getCommunityMembers(selectedId))
    setPosts(getCommunityPosts(selectedId))
  }

  const handleCopyCode = () => {
    if (selected?.codigo) {
      navigator.clipboard.writeText(selected.codigo)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  const handleRemoveMember = (memberId: string) => {
    removeMemberFromCommunity(memberId)
    refreshData()
  }

  const handleEnableFunnels = (memberId: string) => {
    if (!selected) return
    updateMemberFunnels(memberId, selected.embudos_default)
    refreshData()
  }

  const handlePostSubmit = () => {
    if (!newPostContent.trim() || !selectedId || !user) return
    addCommunityPost({
      communityId: selectedId,
      authorName: user.name,
      authorEmail: user.email,
      content: newPostContent.trim(),
      timestamp: new Date().toISOString(),
    })
    setNewPostContent("")
    refreshData()
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comunidades</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gestiona las comunidades de tu plataforma. Cada comunidad tiene miembros, embudos y contenido separado.
        </p>
      </div>

      {/* Community selector */}
      <div className="grid gap-4 md:grid-cols-3">
        {communities.filter(c => c.activa).map((community) => {
          const memberCount = getCommunityMembers(community.id).length
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
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: community.color }}
                  />
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
                  {memberCount} miembros
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
                <div
                  className="h-4 w-4 rounded-full"
                  style={{ backgroundColor: selected.color }}
                />
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
              </div>
              {/* Tabs */}
              <div className="flex rounded-lg border border-border/30 bg-muted/20 p-0.5">
                {(["miembros", "feed", "config"] as const).map((t) => (
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
                    {t === "miembros" ? "Miembros" : t === "feed" ? "Feed" : "Config"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {/* Miembros tab */}
            {tab === "miembros" && (
              <div>
                {members.length === 0 ? (
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
                    {members.map((member) => (
                      <div
                        key={member.memberId}
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
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEnableFunnels(member.memberId)}
                            className="h-7 gap-1 text-xs"
                          >
                            <Route className="h-3 w-3" />
                            Habilitar embudos
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveMember(member.memberId)}
                            className="h-7 text-xs text-destructive hover:text-destructive"
                          >
                            <UserX className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Feed tab */}
            {tab === "feed" && (
              <div className="space-y-4">
                {/* Compose */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePostSubmit()}
                    placeholder={`Escribe un mensaje para ${selected.nombre}...`}
                    className="flex-1 rounded-lg border border-border/30 bg-muted/20 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none"
                  />
                  <Button size="sm" onClick={handlePostSubmit} disabled={!newPostContent.trim()} className="gap-1.5">
                    <Send className="h-3.5 w-3.5" />
                    Publicar
                  </Button>
                </div>

                {/* Posts */}
                {posts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare className="h-10 w-10 text-muted-foreground/30 mb-3" />
                    <p className="text-sm text-muted-foreground">No hay publicaciones en esta comunidad.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {posts.map((post) => (
                      <div key={post.id} className="rounded-lg border border-border/30 bg-card/30 p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                            {post.authorName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </div>
                          <span className="text-xs font-medium text-foreground">{post.authorName}</span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(post.timestamp).toLocaleDateString("es", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                        <p className="text-sm text-foreground/80">{post.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Config tab */}
            {tab === "config" && (
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
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Embudos por defecto</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Estos embudos se habilitan automaticamente cuando un miembro se une a esta comunidad.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {selected.embudos_default.length > 0 ? (
                      selected.embudos_default.map((fId) => {
                        const embudo = EMBUDOS.find((e) => e.id === fId)
                        return (
                          <span
                            key={fId}
                            className="flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary"
                          >
                            <div
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: embudo?.color || "#8b5cf6" }}
                            />
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
                      <p className="text-2xl font-bold text-foreground">{members.length}</p>
                      <span className="text-xs text-muted-foreground">Miembros</span>
                    </div>
                    <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{selected.embudos_default.length}</p>
                      <span className="text-xs text-muted-foreground">Embudos</span>
                    </div>
                    <div className="rounded-lg border border-border/30 bg-muted/10 p-3 text-center">
                      <p className="text-2xl font-bold text-foreground">{posts.length}</p>
                      <span className="text-xs text-muted-foreground">Publicaciones</span>
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
