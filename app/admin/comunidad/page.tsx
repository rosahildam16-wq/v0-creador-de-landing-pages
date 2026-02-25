"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import {
  Heart, MessageCircle, Share2, Search, Crown, Trophy, Award,
  TrendingUp, Star, Send, ImagePlus, Pin, MoreHorizontal, Flame,
  ThumbsUp, PartyPopper, Lightbulb, Bookmark, Filter, ChevronDown,
  Users, X, Smile, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

// -- Types --
interface CommunityPost {
  id: string
  author: string
  avatar?: string
  content: string
  timestamp: Date
  category: string
  badge?: string
  likes: number
  comments: CommunityComment[]
  reactions: Record<string, number>
  pinned?: boolean
  image?: string
  liked?: boolean
  bookmarked?: boolean
}

interface CommunityComment {
  id: string
  author: string
  content: string
  timestamp: Date
  likes: number
}

interface LeaderboardMember {
  name: string
  points: number
  level: number
  badge: string
  streak: number
  avatar?: string
}

// -- Constants --
const CATEGORIES = [
  { name: "Todos", emoji: "" },
  { name: "General", emoji: "💬" },
  { name: "Logros", emoji: "🏆" },
  { name: "Recursos", emoji: "📚" },
  { name: "Preguntas", emoji: "❓" },
  { name: "Networking", emoji: "🤝" },
  { name: "Motivacion", emoji: "🔥" },
]

const REACTIONS = [
  { key: "fire", icon: Flame, label: "Fuego" },
  { key: "thumbsUp", icon: ThumbsUp, label: "Me gusta" },
  { key: "party", icon: PartyPopper, label: "Celebrar" },
  { key: "idea", icon: Lightbulb, label: "Idea" },
]

const AVATAR_COLORS = [
  ["#6366f1", "#8b5cf6"], ["#ec4899", "#f43f5e"], ["#14b8a6", "#06b6d4"],
  ["#f59e0b", "#f97316"], ["#10b981", "#34d399"], ["#8b5cf6", "#a78bfa"],
  ["#3b82f6", "#2dd4bf"], ["#f472b6", "#c084fc"],
]

const BADGE_STYLES: Record<string, { bg: string; text: string; glow: string }> = {
  Diamante: { bg: "linear-gradient(135deg, #818cf8, #6366f1, #4f46e5)", text: "#fff", glow: "0 0 12px #6366f133" },
  Oro: { bg: "linear-gradient(135deg, #fbbf24, #f59e0b, #d97706)", text: "#fff", glow: "0 0 12px #f59e0b33" },
  Plata: { bg: "linear-gradient(135deg, #94a3b8, #64748b, #475569)", text: "#fff", glow: "0 0 12px #64748b33" },
  Bronce: { bg: "linear-gradient(135deg, #d97706, #b45309, #92400e)", text: "#fff", glow: "0 0 12px #d9770633" },
  "Top Contributor": { bg: "linear-gradient(135deg, #8b5cf6, #a855f7)", text: "#fff", glow: "0 0 12px #8b5cf633" },
  Mentor: { bg: "linear-gradient(135deg, #10b981, #059669)", text: "#fff", glow: "0 0 12px #10b98133" },
  Admin: { bg: "linear-gradient(135deg, #ef4444, #dc2626)", text: "#fff", glow: "0 0 12px #ef444433" },
}

// -- Mock Data --
const INITIAL_POSTS: CommunityPost[] = [
  {
    id: "1",
    author: "Sofia Herrera",
    content: "Acabo de cerrar mi primer cliente a $5,000 USD aplicando exactamente lo que aprendimos en el modulo 4. Estoy temblando de la emocion! Gracias a esta comunidad por todo el apoyo. Literalmente cambiaron mi vida.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    category: "Logros",
    badge: "Top Contributor",
    likes: 47,
    reactions: { fire: 23, thumbsUp: 15, party: 31 },
    pinned: true,
    comments: [
      { id: "c1", author: "Miguel Torres", content: "Increible Sofia! Esto es lo que pasa cuando aplicas con consistencia.", timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000), likes: 8 },
      { id: "c2", author: "Laura Mendez", content: "Felicidades!! Me motivas a seguir adelante con mi proyecto.", timestamp: new Date(Date.now() - 45 * 60 * 1000), likes: 5 },
    ],
  },
  {
    id: "2",
    author: "Miguel Torres",
    content: "Comparto mi plantilla de embudo de ventas que me genero $12K el mes pasado. Es un sistema de 5 pasos que cualquiera puede replicar. Espero les sirva tanto como a mi. Dejen sus preguntas abajo!",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    category: "Recursos",
    badge: "Mentor",
    likes: 83,
    reactions: { fire: 12, thumbsUp: 45, idea: 18 },
    comments: [
      { id: "c3", author: "Ana Castillo", content: "Descargada! Mil gracias Miguel, eres un crack.", timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), likes: 3 },
    ],
  },
  {
    id: "3",
    author: "Laura Mendez",
    content: "Alguien mas esta implementando la estrategia de email marketing del ultimo live? Tengo algunas dudas sobre la secuencia de bienvenida y como configurar los triggers. Agradeceria mucho sus insights!",
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    category: "Preguntas",
    likes: 19,
    reactions: { thumbsUp: 8, idea: 4 },
    comments: [
      { id: "c4", author: "Carlos Ruiz", content: "Si! Yo la estoy probando. Te escribo por privado con mi setup.", timestamp: new Date(Date.now() - 7 * 60 * 60 * 1000), likes: 2 },
      { id: "c5", author: "Diego Morales", content: "El truco esta en el delay entre el email 2 y 3. Usa 48 horas minimo.", timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), likes: 11 },
      { id: "c6", author: "Sofia Herrera", content: "Complemento lo que dijo Diego: el subject line del tercer email es clave.", timestamp: new Date(Date.now() - 5.5 * 60 * 60 * 1000), likes: 7 },
    ],
  },
  {
    id: "4",
    author: "Carlos Ruiz",
    content: "30 dias de racha completados! Cada dia compartiendo valor en esta comunidad. El habito de ayudar a otros es el mejor hack de crecimiento que existe. Quien se anima al reto de 30 dias?",
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    category: "Motivacion",
    badge: "Diamante",
    likes: 64,
    reactions: { fire: 38, party: 22, thumbsUp: 19 },
    comments: [],
  },
  {
    id: "5",
    author: "Ana Castillo",
    content: "Acabo de conectar con tres personas increibles en el evento de networking de ayer. Ya tenemos un grupo de accountability. Esto de verdad funciona cuando te comprometes!",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    category: "Networking",
    likes: 31,
    reactions: { party: 14, thumbsUp: 12 },
    comments: [
      { id: "c7", author: "Diego Morales", content: "Me hubiera encantado participar! Avisen para el proximo.", timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000), likes: 4 },
    ],
  },
]

const LEADERBOARD: LeaderboardMember[] = [
  { name: "Sofia Herrera", points: 4850, level: 5, badge: "Diamante", streak: 45 },
  { name: "Carlos Ruiz", points: 3720, level: 4, badge: "Oro", streak: 30 },
  { name: "Miguel Torres", points: 3410, level: 4, badge: "Oro", streak: 22 },
  { name: "Ana Castillo", points: 2890, level: 3, badge: "Plata", streak: 15 },
  { name: "Diego Morales", points: 2150, level: 2, badge: "Bronce", streak: 8 },
  { name: "Laura Mendez", points: 1820, level: 2, badge: "Bronce", streak: 12 },
  { name: "Pedro Sanchez", points: 1540, level: 1, badge: "Bronce", streak: 5 },
]

// -- Helpers --
function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
}
function getAvatarColor(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}
function timeAgo(date: Date) {
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `hace ${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `hace ${hrs}h`
  const days = Math.floor(hrs / 24)
  return `hace ${days}d`
}

// ===== COMPONENTS =====

function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const colors = getAvatarColor(name)
  const sizeMap = { sm: "h-7 w-7 text-[10px]", md: "h-9 w-9 text-xs", lg: "h-11 w-11 text-sm" }
  return (
    <div
      className={cn("flex shrink-0 items-center justify-center rounded-full font-bold text-white", sizeMap[size])}
      style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
    >
      {getInitials(name)}
    </div>
  )
}

function Badge({ label }: { label: string }) {
  const style = BADGE_STYLES[label]
  if (!style) return null
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: style.bg, color: style.text, boxShadow: style.glow }}
    >
      {label}
    </span>
  )
}

// ===== POST CARD =====
function PostCard({
  post,
  onLike,
  onReact,
  onComment,
  onBookmark,
  currentUser,
}: {
  post: CommunityPost
  onLike: () => void
  onReact: (key: string) => void
  onComment: (text: string) => void
  onBookmark: () => void
  currentUser: string
}) {
  const [expanded, setExpanded] = useState(false)
  const [showComments, setShowComments] = useState(false)
  const [commentText, setCommentText] = useState("")
  const [showReactions, setShowReactions] = useState(false)

  return (
    <article
      className={cn(
        "glass-card rounded-xl p-5 transition-all duration-300",
        post.pinned && "ring-1 ring-primary/20"
      )}
    >
      {post.pinned && (
        <div className="mb-3 flex items-center gap-1.5 text-[11px] font-medium text-primary">
          <Pin className="h-3 w-3" />
          <span>Publicacion fijada</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={post.author} size="md" />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-foreground">{post.author}</span>
              {post.badge && <Badge label={post.badge} />}
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>{timeAgo(post.timestamp)}</span>
              <span className="opacity-40">en</span>
              <span className="font-medium text-primary/70">{post.category}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onBookmark}
            className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Bookmark className={cn("h-3.5 w-3.5", post.bookmarked && "fill-primary text-primary")} />
          </button>
          <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className={cn("text-sm leading-relaxed text-foreground/85", !expanded && post.content.length > 200 && "line-clamp-3")}>
          {post.content}
        </p>
        {post.content.length > 200 && (
          <button onClick={() => setExpanded(!expanded)} className="mt-1 text-xs font-medium text-primary hover:underline">
            {expanded ? "Ver menos" : "Ver mas..."}
          </button>
        )}
      </div>

      {/* Reactions summary */}
      {Object.keys(post.reactions).length > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-1.5">
          {Object.entries(post.reactions)
            .filter(([, count]) => count > 0)
            .map(([key, count]) => {
              const r = REACTIONS.find((rx) => rx.key === key)
              if (!r) return null
              const Icon = r.icon
              return (
                <button
                  key={key}
                  onClick={() => onReact(key)}
                  className="flex items-center gap-1 rounded-full border border-border/40 bg-secondary/30 px-2 py-1 text-[11px] transition-all hover:border-primary/30 hover:bg-primary/10"
                >
                  <Icon className="h-3 w-3 text-primary/80" />
                  <span className="font-medium text-muted-foreground">{count}</span>
                </button>
              )
            })}
        </div>
      )}

      {/* Action Bar */}
      <div className="flex items-center gap-1 border-t border-border/30 pt-3">
        <button
          onClick={onLike}
          className={cn(
            "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all",
            post.liked ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
          )}
        >
          <Heart className={cn("h-3.5 w-3.5", post.liked && "fill-primary")} />
          <span>{post.likes}</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
        >
          <MessageCircle className="h-3.5 w-3.5" />
          <span>{post.comments.length}</span>
        </button>
        <div className="relative">
          <button
            onClick={() => setShowReactions(!showReactions)}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground"
          >
            <Smile className="h-3.5 w-3.5" />
            <span>Reaccionar</span>
          </button>
          {showReactions && (
            <div className="absolute bottom-full left-0 z-10 mb-2 flex gap-1 rounded-xl border border-border/40 bg-card p-1.5 shadow-xl">
              {REACTIONS.map((r) => {
                const Icon = r.icon
                return (
                  <button
                    key={r.key}
                    onClick={() => { onReact(r.key); setShowReactions(false) }}
                    className="rounded-lg p-2 transition-all hover:scale-110 hover:bg-primary/10"
                    title={r.label}
                  >
                    <Icon className="h-4 w-4 text-primary/80" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
        <button className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:bg-secondary hover:text-foreground">
          <Share2 className="h-3.5 w-3.5" />
          <span>Compartir</span>
        </button>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="mt-4 border-t border-border/20 pt-4">
          {post.comments.length > 0 && (
            <div className="mb-4 flex flex-col gap-3">
              {post.comments.map((c) => (
                <div key={c.id} className="flex gap-2.5">
                  <Avatar name={c.author} size="sm" />
                  <div className="flex-1 rounded-lg bg-secondary/30 px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-foreground">{c.author}</span>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(c.timestamp)}</span>
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-foreground/80">{c.content}</p>
                    <button className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground hover:text-primary">
                      <Heart className="h-2.5 w-2.5" /> {c.likes}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Avatar name={user?.email ?? "T"} size="sm" />
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/30 bg-secondary/20 px-3 py-2">
              <input
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && commentText.trim()) {
                    onComment(commentText.trim())
                    setCommentText("")
                  }
                }}
                placeholder="Escribe un comentario..."
                className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
              />
              <button
                onClick={() => { if (commentText.trim()) { onComment(commentText.trim()); setCommentText("") } }}
                className={cn(
                  "rounded-md p-1 transition-all",
                  commentText.trim() ? "text-primary hover:bg-primary/10" : "text-muted-foreground/40"
                )}
                disabled={!commentText.trim()}
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  )

  // eslint-disable-next-line react-hooks/rules-of-hooks -- hoisted reference
  var user = useAuth().user
}

// ===== MAIN PAGE =====
export default function ComunidadPage() {
  const { user } = useAuth()
  const [posts, setPosts] = useState<CommunityPost[]>(INITIAL_POSTS)
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [showNewPost, setShowNewPost] = useState(false)
  const [newPostContent, setNewPostContent] = useState("")
  const [newPostCategory, setNewPostCategory] = useState("General")
  const [showMobileLeaderboard, setShowMobileLeaderboard] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (showNewPost && textareaRef.current) textareaRef.current.focus()
  }, [showNewPost])

  const filteredPosts = useMemo(() => {
    let result = [...posts]
    if (activeCategory !== "Todos") result = result.filter((p) => p.category === activeCategory)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter((p) => p.content.toLowerCase().includes(q) || p.author.toLowerCase().includes(q))
    }
    // Pinned first, then by timestamp
    result.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1
      if (!a.pinned && b.pinned) return 1
      return b.timestamp.getTime() - a.timestamp.getTime()
    })
    return result
  }, [posts, activeCategory, searchQuery])

  function handleCreatePost() {
    if (!newPostContent.trim()) return
    const newPost: CommunityPost = {
      id: Date.now().toString(),
      author: user?.email?.split("@")[0] ?? "Tu",
      content: newPostContent.trim(),
      timestamp: new Date(),
      category: newPostCategory,
      badge: "Admin",
      likes: 0,
      reactions: {},
      comments: [],
    }
    setPosts((prev) => [newPost, ...prev])
    setNewPostContent("")
    setShowNewPost(false)
  }

  function handleLike(id: string) {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
  }
  function handleReact(id: string, key: string) {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, reactions: { ...p.reactions, [key]: (p.reactions[key] ?? 0) + 1 } } : p))
  }
  function handleComment(id: string, text: string) {
    const comment: CommunityComment = {
      id: Date.now().toString(),
      author: user?.email?.split("@")[0] ?? "Tu",
      content: text,
      timestamp: new Date(),
      likes: 0,
    }
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, comments: [...p.comments, comment] } : p))
  }
  function handleBookmark(id: string) {
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, bookmarked: !p.bookmarked } : p))
  }

  const totalMembers = LEADERBOARD.length
  const totalPosts = posts.length
  const totalReactions = posts.reduce((acc, p) => acc + Object.values(p.reactions).reduce((a, b) => a + b, 0), 0)

  return (
    <div className="flex flex-1 flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-10 border-b border-border/30 bg-background/80 px-6 py-4 backdrop-blur-xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Comunidad</h1>
            <p className="text-sm text-muted-foreground">Conecta, comparte y crece con tu equipo</p>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats pills */}
            <div className="hidden items-center gap-2 md:flex">
              <div className="flex items-center gap-1.5 rounded-full border border-border/30 bg-secondary/30 px-3 py-1.5 text-xs">
                <Users className="h-3 w-3 text-primary" />
                <span className="font-semibold text-foreground">{totalMembers}</span>
                <span className="text-muted-foreground">miembros</span>
              </div>
              <div className="flex items-center gap-1.5 rounded-full border border-border/30 bg-secondary/30 px-3 py-1.5 text-xs">
                <Flame className="h-3 w-3 text-orange-400" />
                <span className="font-semibold text-foreground">{totalReactions}</span>
                <span className="text-muted-foreground">reacciones</span>
              </div>
            </div>
            <button
              onClick={() => setShowMobileLeaderboard(!showMobileLeaderboard)}
              className="flex items-center gap-1.5 rounded-lg border border-border/30 px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
            >
              <Trophy className="h-3.5 w-3.5" />
              Ranking
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 gap-0 lg:gap-6">
        {/* Main Feed */}
        <main className="flex-1 px-6 py-6">
          {/* Search + Filter bar */}
          <div className="mb-5 flex flex-wrap items-center gap-3">
            <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/30 bg-secondary/20 px-3 py-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar en la comunidad..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-muted-foreground hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Categories */}
          <div className="mb-5 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setActiveCategory(cat.name)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                  activeCategory === cat.name
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                    : "border border-border/30 bg-secondary/20 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                )}
              >
                {cat.emoji && <span className="mr-1">{cat.emoji}</span>}
                {cat.name}
              </button>
            ))}
          </div>

          {/* New Post Composer */}
          <div className="mb-6 overflow-hidden rounded-xl glass-card">
            {!showNewPost ? (
              <button
                onClick={() => setShowNewPost(true)}
                className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-secondary/20"
              >
                <Avatar name={user?.email ?? "Tu"} size="md" />
                <span className="flex-1 text-sm text-muted-foreground">
                  Comparte algo con la comunidad...
                </span>
                <ImagePlus className="h-4 w-4 text-muted-foreground" />
              </button>
            ) : (
              <div className="p-4">
                <div className="mb-3 flex items-start gap-3">
                  <Avatar name={user?.email ?? "Tu"} size="md" />
                  <div className="flex-1">
                    <textarea
                      ref={textareaRef}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      placeholder="Que quieres compartir hoy?"
                      rows={3}
                      className="w-full resize-none bg-transparent text-sm leading-relaxed text-foreground placeholder:text-muted-foreground outline-none"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between border-t border-border/20 pt-3">
                  <div className="flex items-center gap-2">
                    <select
                      value={newPostCategory}
                      onChange={(e) => setNewPostCategory(e.target.value)}
                      className="rounded-lg border border-border/30 bg-secondary/30 px-2.5 py-1.5 text-xs text-foreground"
                    >
                      {CATEGORIES.filter((c) => c.name !== "Todos").map((c) => (
                        <option key={c.name} value={c.name}>{c.emoji} {c.name}</option>
                      ))}
                    </select>
                    <button className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
                      <ImagePlus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setShowNewPost(false); setNewPostContent("") }}
                      className="rounded-lg px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleCreatePost}
                      disabled={!newPostContent.trim()}
                      className={cn(
                        "flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-semibold transition-all",
                        newPostContent.trim()
                          ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:opacity-90"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      <Send className="h-3 w-3" />
                      Publicar
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Feed */}
          <div className="flex flex-col gap-4">
            {filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-border/20 py-16 text-center">
                <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/30" />
                <p className="text-sm font-medium text-muted-foreground">No hay publicaciones aqui</p>
                <p className="mt-1 text-xs text-muted-foreground/60">Se el primero en publicar algo en esta categoria</p>
              </div>
            ) : (
              filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={() => handleLike(post.id)}
                  onReact={(key) => handleReact(post.id, key)}
                  onComment={(text) => handleComment(post.id, text)}
                  onBookmark={() => handleBookmark(post.id)}
                />
              ))
            )}
          </div>
        </main>

        {/* Right Sidebar: Leaderboard */}
        <aside
          className={cn(
            "w-80 shrink-0 border-l border-border/20 bg-background/40 px-5 py-6",
            "hidden lg:block",
          )}
        >
          <LeaderboardPanel members={LEADERBOARD} stats={{ totalMembers, totalPosts, totalReactions }} />
        </aside>

        {/* Mobile Leaderboard Overlay */}
        {showMobileLeaderboard && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileLeaderboard(false)} />
            <div className="relative ml-auto h-full w-80 overflow-y-auto border-l border-border/20 bg-background px-5 py-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Leaderboard</h3>
                <button onClick={() => setShowMobileLeaderboard(false)} className="rounded-lg p-1 text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <LeaderboardPanel members={LEADERBOARD} stats={{ totalMembers, totalPosts, totalReactions }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ===== LEADERBOARD PANEL =====
function LeaderboardPanel({
  members,
  stats,
}: {
  members: LeaderboardMember[]
  stats: { totalMembers: number; totalPosts: number; totalReactions: number }
}) {
  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Trophy className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Leaderboard</h3>
          <p className="text-[10px] text-muted-foreground">Ranking de esta semana</p>
        </div>
      </div>

      {/* Members */}
      <div className="flex flex-col gap-2">
        {members.map((m, i) => {
          const colors = getAvatarColor(m.name)
          const maxPts = members[0]?.points ?? 1
          const progress = (m.points / maxPts) * 100
          const RankIcon = i === 0 ? Crown : i === 1 ? Award : i === 2 ? TrendingUp : Star
          const rankColors = ["#f59e0b", "#94a3b8", "#d97706"]

          return (
            <div
              key={m.name}
              className="group flex items-center gap-2.5 rounded-lg p-2 transition-all hover:bg-secondary/30"
            >
              {/* Rank */}
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                {i < 3 ? (
                  <RankIcon className="h-4 w-4" style={{ color: rankColors[i] }} />
                ) : (
                  <span className="text-[10px] font-bold text-muted-foreground">#{i + 1}</span>
                )}
              </div>

              {/* Avatar */}
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
                style={{ background: `linear-gradient(135deg, ${colors[0]}, ${colors[1]})` }}
              >
                {getInitials(m.name)}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="truncate text-xs font-semibold text-foreground">{m.name}</span>
                  <Badge label={m.badge} />
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${progress}%`,
                        background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)))`,
                      }}
                    />
                  </div>
                  <span className="shrink-0 text-[10px] font-medium text-muted-foreground">{m.points.toLocaleString()}</span>
                </div>
                {/* Streak */}
                {m.streak > 0 && (
                  <div className="mt-0.5 flex items-center gap-1 text-[10px] text-orange-400/80">
                    <Flame className="h-2.5 w-2.5" />
                    <span>{m.streak} dias de racha</span>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Community Stats */}
      <div className="rounded-xl border border-border/20 bg-secondary/10 p-4">
        <h4 className="mb-3 text-xs font-semibold text-foreground">Actividad de la comunidad</h4>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-lg font-bold text-primary">{stats.totalMembers}</p>
            <p className="text-[10px] text-muted-foreground">Miembros</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-foreground">{stats.totalPosts}</p>
            <p className="text-[10px] text-muted-foreground">Posts</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-bold text-orange-400">{stats.totalReactions}</p>
            <p className="text-[10px] text-muted-foreground">Reacciones</p>
          </div>
        </div>
      </div>

      {/* Level Guide */}
      <div className="rounded-xl border border-border/20 bg-secondary/10 p-4">
        <h4 className="mb-3 text-xs font-semibold text-foreground">Niveles</h4>
        <div className="flex flex-col gap-2">
          {[
            { badge: "Diamante", min: "4,000+" },
            { badge: "Oro", min: "2,500+" },
            { badge: "Plata", min: "1,500+" },
            { badge: "Bronce", min: "0+" },
          ].map((level) => (
            <div key={level.badge} className="flex items-center justify-between">
              <Badge label={level.badge} />
              <span className="text-[10px] text-muted-foreground">{level.min} pts</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
