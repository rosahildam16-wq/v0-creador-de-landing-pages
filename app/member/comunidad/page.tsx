"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getMemberCommunity, getCommunityPosts, addCommunityPost, getCommunityMembers, type Community, type CommunityPost, type CommunityMember } from "@/lib/communities-data"
import { getCoursesByCategory } from "@/lib/courses-data"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Send, MessageSquare, Users, Shield,
  BookOpen, Trophy, Search, Layout,
  MoreHorizontal, Share2, Heart, Award,
  Sparkles, Zap, Star, ExternalLink, Loader2
} from "lucide-react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDistanceToNow } from "date-fns"
import { es } from "date-fns/locale"

type Tab = "feed" | "classroom" | "members" | "about"

export default function MemberComunidadPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<Tab>("feed")
  const [community, setCommunity] = useState<Community | undefined>()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [newPost, setNewPost] = useState("")
  const [mounted, setMounted] = useState(false)

  const [subLoading, setSubLoading] = useState(true)
  const [subscription, setSubscription] = useState<any>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [formData, setFormData] = useState({ nombre: "", codigo: "", descripcion: "" })
  const [submitting, setSubmitting] = useState(false)
  const [msg, setMsg] = useState({ type: "", text: "" })

  useEffect(() => {
    setMounted(true)
    if (!user?.email) return

    const fetchAll = async () => {
      // 1. Load community from DB (source of truth — replaces static localStorage lookup)
      try {
        const res = await fetch(`/api/communities/my-community?email=${encodeURIComponent(user.email)}`)
        if (res.ok) {
          const data = await res.json()
          if (data.community) {
            const dbComm = data.community
            const mappedComm: Community = {
              id: dbComm.id,
              nombre: dbComm.nombre,
              codigo: dbComm.codigo || null,
              embudos_default: dbComm.embudos_default || [],
              color: dbComm.color || "#8b5cf6",
              descripcion: dbComm.descripcion || "",
              activa: dbComm.activa !== false,
              leaderEmail: dbComm.leader_email || null,
              leaderName: dbComm.leader_name || null,
              cuota_miembro: dbComm.cuota_miembro || 0,
              mailing_enabled: false,
              createdAt: dbComm.created_at || new Date().toISOString(),
            }
            setCommunity(mappedComm)
            setPosts(getCommunityPosts(mappedComm.id))
            setMembers(getCommunityMembers(mappedComm.id))
          }
        }
      } catch {
        // Fallback: static lookup for legacy users
        if (user.memberId) {
          const comm = getMemberCommunity(user.memberId)
          if (comm) {
            setCommunity(comm)
            setPosts(getCommunityPosts(comm.id))
            setMembers(getCommunityMembers(comm.id))
          }
        }
      }

      // 2. Fetch subscription to check plan (for upgrade gate)
      try {
        const res = await fetch(`/api/payments/check-subscription?email=${encodeURIComponent(user.email)}`)
        const data = await res.json()
        setSubscription(data.subscription)
      } catch (e) {
        console.error("Error fetching sub:", e)
      } finally {
        setSubLoading(false)
      }
    }

    fetchAll()
  }, [user])

  const handlePost = () => {
    if (!newPost.trim() || !community || !user) return
    addCommunityPost({
      communityId: community.id,
      authorName: user.name,
      authorEmail: user.email,
      content: newPost.trim(),
      timestamp: new Date().toISOString(),
    })
    setNewPost("")
    if (community) {
      setPosts(getCommunityPosts(community.id))
    }
  }

  const handleCreateCommunity = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMsg({ type: "", text: "" })
    try {
      const res = await fetch("/api/communities/my-community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, email: user?.email }),
      })
      const data = await res.json()
      if (res.ok) {
        setMsg({ type: "success", text: "Comunidad creada con exito. Recargando..." })
        setTimeout(() => window.location.reload(), 1500)
      } else {
        setMsg({ type: "error", text: data.error || "Error al crear la comunidad" })
      }
    } catch (e) {
      setMsg({ type: "error", text: "Error de red" })
    } finally {
      setSubmitting(false)
    }
  }

  const QUALIFYING_PLANS = ["plan_47", "plan_97", "plan_300", "pro", "elite"]
  const canCreate =
    user?.role === "leader" ||
    user?.role === "super_admin" ||
    QUALIFYING_PLANS.includes(subscription?.plan_id || "")

  if (!mounted) return null

  if (!community) {
    if (subLoading) return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )

    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="rounded-[2.5rem] border border-border/30 bg-card/40 p-10 max-w-xl backdrop-blur-md shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />

          <div className="relative z-10">
            <div className="h-16 w-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20">
              <Users className="h-8 w-8 text-primary" />
            </div>

            <h2 className="text-2xl font-extrabold text-white mb-3 tracking-tight">Aún no perteneces a una comunidad</h2>
            <p className="text-muted-foreground mb-6 leading-relaxed text-sm">
              Para unirte necesitas un link de invitación de tu patrocinador. Pídele a quien te refirió que comparta su link contigo.
            </p>

            <a
              href="/join"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <ExternalLink className="h-4 w-4" />
              Ingresar link de invitación
            </a>

            {showCreateForm ? (
              <form onSubmit={handleCreateCommunity} className="space-y-4 text-left animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block">Nombre de tu comunidad</label>
                  <input
                    required
                    placeholder="Ej: Visionarios VIP"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-1 focus:ring-primary/40 outline-none"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest ml-1 mb-1.5 block">Codigo de acceso (Unico)</label>
                  <input
                    required
                    placeholder="Ej: VISION2026"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono uppercase focus:ring-1 focus:ring-primary/40 outline-none"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  />
                </div>
                {msg.text && (
                  <p className={cn("text-xs font-bold px-3 py-2 rounded-lg", msg.type === "success" ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400")}>
                    {msg.text}
                  </p>
                )}
                <div className="flex gap-3 pt-2">
                  <Button type="button" variant="ghost" className="flex-1 rounded-xl" onClick={() => setShowCreateForm(false)}>Cancelar</Button>
                  <Button type="submit" disabled={submitting} className="flex-1 rounded-xl bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/25">
                    {submitting ? "Creando..." : "Crear Ahora"}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                {canCreate ? (
                  <Button
                    size="lg"
                    className="w-full rounded-2xl bg-primary text-primary-foreground font-bold h-14 text-base shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                    onClick={() => setShowCreateForm(true)}
                  >
                    Configurar mi Comunidad
                  </Button>
                ) : (
                  <div className="space-y-6">
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-sm font-medium">
                      Se requiere el Plan Pro ($47 USD) o superior para crear tu propia comunidad.
                    </div>
                    <Link href="/member/suscripcion">
                      <Button size="lg" className="w-full rounded-2xl bg-white text-black font-bold h-14 text-base hover:bg-white/90">
                        Mejorar mi Plan
                      </Button>
                    </Link>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground/50 pt-4">
                  ¿Tienes un codigo de otra comunidad? <Link href="/member/perfil" className="text-primary hover:underline">Ingresalo aqui</Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Skool-style Subheader with Tabs */}
      <div className="sticky top-0 z-20 border-b border-border/10 bg-background/60 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
            <div className="flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden"
                style={{ backgroundColor: community.color }}
              >
                {community.nombre[0]}
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground leading-none">{community.nombre}</h1>
                <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {members.length} miembros activos
                </p>
              </div>
            </div>

            <div className="flex items-center bg-secondary/50 p-1 rounded-xl">
              <TabButton active={activeTab === "feed"} onClick={() => setActiveTab("feed")} icon={<Layout className="h-4 w-4" />} label="Comunidad" />
              <TabButton active={activeTab === "classroom"} onClick={() => setActiveTab("classroom")} icon={<BookOpen className="h-4 w-4" />} label="Formación" />
              <TabButton active={activeTab === "members"} onClick={() => setActiveTab("members")} icon={<Users className="h-4 w-4" />} label="Miembros" />
              <TabButton active={activeTab === "about"} onClick={() => setActiveTab("about")} icon={<Shield className="h-4 w-4" />} label="Acerca" />
            </div>

            <div className="hidden lg:flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar en la comunidad..."
                  className="rounded-full bg-secondary/60 border-none pl-9 pr-4 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary/30 outline-none w-48"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-6">

            {activeTab === "feed" && (
              <>
                {/* Compose Post */}
                <Card className="border-border/10 bg-card/40 overflow-hidden shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {user?.name?.[0]}
                      </div>
                      <div className="flex-1 space-y-3">
                        <textarea
                          value={newPost}
                          onChange={(e) => setNewPost(e.target.value)}
                          placeholder="Escribe algo para tu comunidad de Eskalia..."
                          className="w-full bg-transparent border-none text-foreground placeholder:text-muted-foreground/40 resize-none py-2 text-sm focus:ring-0 outline-none min-h-[60px]"
                        />
                        <div className="flex items-center justify-between pt-2 border-t border-border/5">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" className="h-8 text-[11px] gap-1 px-2 text-muted-foreground hover:text-foreground">
                              <Star className="h-3.5 w-3.5" /> General
                            </Button>
                          </div>
                          <Button
                            onClick={handlePost}
                            disabled={!newPost.trim()}
                            size="sm"
                            className="bg-primary text-primary-foreground font-semibold px-6 shadow-sm shadow-primary/20"
                          >
                            Publicar
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Posts Feed */}
                <div className="space-y-4">
                  {posts.length === 0 ? (
                    <div className="py-20 text-center">
                      <Sparkles className="h-12 w-12 text-primary/20 mx-auto mb-4" />
                      <p className="text-muted-foreground">La comunidad está tranquila hoy...</p>
                    </div>
                  ) : (
                    posts.map((post) => (
                      <Card key={post.id} className="border-border/10 bg-card/40 overflow-hidden shadow-sm hover:border-primary/10 transition-colors">
                        <CardContent className="p-5">
                          <div className="flex items-start gap-4">
                            <div className="h-10 w-10 flex-shrink-0 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold">
                              {post.authorName[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-foreground">{post.authorName}</span>
                                  <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">MIEMBRO</span>
                                  <span className="text-[10px] text-muted-foreground">
                                    • {formatDistanceToNow(new Date(post.timestamp), { addSuffix: true, locale: es })}
                                  </span>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </div>
                              <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                                {post.content}
                              </p>
                              <div className="mt-4 flex items-center gap-4 text-muted-foreground">
                                <button className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs font-medium">
                                  <Heart className="h-4 w-4" /> 0
                                </button>
                                <button className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs font-medium">
                                  <MessageSquare className="h-4 w-4" /> 0
                                </button>
                                <button className="flex items-center gap-1.5 hover:text-primary transition-colors text-xs font-medium">
                                  <Share2 className="h-4 w-4" /> Compartir
                                </button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}
                </div>
              </>
            )}

            {activeTab === "classroom" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Programas de Formación</h2>
                  <Badge variant="outline" className="border-primary/20 text-primary">{community.id === 'comm-reset' ? 'RESETERS' : 'ACADEMIA'}</Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {getCoursesByCategory("Todos", community.id).map((course) => (
                    <CourseCard
                      key={course.id}
                      title={course.titulo}
                      lessons={course.totalLecciones}
                      students={120 + Math.floor(Math.random() * 200)}
                      color={course.id === 'reset-system' ? '#06b6d4' : '#8b5cf6'}
                      progress={course.id === 'reset-system' ? 45 : 0}
                    />
                  ))}
                  {getCoursesByCategory("Todos", community.id).length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-40 italic">
                      No hay cursos disponibles para esta comunidad aún.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "members" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-foreground">Directorio de Miembros</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input className="bg-secondary/40 border-none rounded-lg pl-9 pr-4 py-1.5 text-xs w-48 outline-none focus:ring-1 focus:ring-primary/30" placeholder="Buscar socio..." />
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {members.map((m) => (
                    <div key={m.memberId} className="group flex flex-col items-center justify-center p-6 rounded-2xl bg-card/40 border border-border/10 text-center transition-all hover:border-primary/20 hover:bg-card/60">
                      <div className="relative mb-3">
                        <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center text-xl font-bold text-foreground overflow-hidden border-2 border-border/30 group-hover:border-primary/50 transition-colors">
                          {m.name[0].toUpperCase()}
                        </div>
                        <div className="absolute bottom-0 right-0 h-4 w-4 bg-emerald-500 border-2 border-background rounded-full shadow-sm" />
                      </div>
                      <span className="text-sm font-bold truncate w-full group-hover:text-primary transition-colors">{m.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Socio Activo</span>
                      <Button variant="ghost" size="sm" className="mt-3 h-7 text-[10px] uppercase font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Ver Perfil
                      </Button>
                    </div>
                  ))}
                  {members.length === 0 && (
                    <div className="col-span-full py-20 text-center opacity-40 italic">No hay miembros registrados aún</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-4 space-y-6">
            {/* Gamification Sidebar */}
            <Card className="border-border/10 bg-card/40 overflow-hidden shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                  <Trophy className="h-4 w-4 text-amber-500" /> Leaderboard
                </h3>
                <div className="space-y-4">
                  <LeaderItem rank={1} name="Socio Diamante" pts={4520} level={12} />
                  <LeaderItem rank={2} name="Marketing Pro" pts={3890} level={9} />
                  <LeaderItem rank={3} name="Reset Master" pts={3240} level={8} />
                </div>
                <div className="mt-6 pt-6 border-t border-border/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium">Tu progreso</span>
                    <span className="text-[10px] text-muted-foreground">Level 1</span>
                  </div>
                  <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[30%]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events or Links */}
            <Card className="border-border/10 bg-card/40 overflow-hidden shadow-sm">
              <CardContent className="p-6">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2 mb-4">
                  <Zap className="h-4 w-4 text-primary" /> Recursos Eskalia
                </h3>
                <div className="space-y-3">
                  <ResourceLink icon={<Award className="h-4 w-4" />} label="Llamada Semanal VIP" date="Lunes 20:00" />
                  <ResourceLink icon={<Layout className="h-4 w-4" />} label="Biblioteca de Anuncios" />
                  <ResourceLink icon={<Users className="h-4 w-4" />} label="Grupo Privado WA" />
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}

function TabButton({ active, label, icon, onClick }: { active: boolean, label: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all",
        active
          ? "bg-white text-black shadow-sm"
          : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function CourseCard({ title, lessons, students, color, progress = 0 }: { title: string, lessons: number, students: number, color: string, progress?: number }) {
  return (
    <Card className="border-border/10 bg-card/40 overflow-hidden hover:border-primary/20 transition-all group cursor-pointer">
      <div className="h-24 px-6 flex items-center relative overflow-hidden" style={{ backgroundColor: `${color}15` }}>
        <Award className="h-10 w-10 text-primary group-hover:scale-110 transition-transform relative z-10" style={{ color }} />
        {progress > 0 && (
          <div className="absolute bottom-0 left-0 h-1 bg-primary/30 w-full">
            <div className="h-full bg-primary" style={{ width: `${progress}%`, backgroundColor: color }} />
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-1">
          <h4 className="font-bold text-sm text-foreground">{title}</h4>
          {progress > 0 && <span className="text-[10px] font-bold text-muted-foreground">{progress}%</span>}
        </div>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-semibold">
          <span>{lessons} LECCIONES</span>
          <span>{students} ALUMNOS</span>
        </div>
      </CardContent>
    </Card>
  )
}

function LeaderItem({ rank, name, pts, level }: { rank: number, name: string, pts: number, level: number }) {
  return (
    <div className="flex items-center gap-3">
      <span className={cn(
        "h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold",
        rank === 1 ? "bg-amber-500 text-amber-950" : "bg-secondary text-muted-foreground"
      )}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{name}</p>
        <p className="text-[10px] text-muted-foreground font-medium">{pts} pts • Nivel {level}</p>
      </div>
    </div>
  )
}

function ResourceLink({ icon, label, date }: { icon: React.ReactNode, label: string, date?: string }) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-primary/5 cursor-pointer group transition-colors">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
          {icon}
        </div>
        <div className="flex flex-col">
          <span className="text-xs font-bold group-hover:text-primary transition-colors">{label}</span>
          {date && <span className="text-[10px] text-muted-foreground">{date}</span>}
        </div>
      </div>
      <ExternalLink className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary/50" />
    </div>
  )
}

