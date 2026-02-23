"use client"

import { useState, useEffect } from "react"
import { useLeaderCommunity } from "@/hooks/use-leader-community"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessagesSquare, Send, Heart, Shield } from "lucide-react"

interface CommunityPost {
  id: string
  communityId: string
  authorName: string
  authorEmail: string
  content: string
  timestamp: string
  likes: number
}

function getPosts(communityId: string): CommunityPost[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem("mf_community_posts") || "[]"
    return (JSON.parse(raw) as CommunityPost[]).filter((p) => p.communityId === communityId)
  } catch { return [] }
}

function addPost(post: CommunityPost) {
  try {
    const raw = localStorage.getItem("mf_community_posts") || "[]"
    const all = JSON.parse(raw) as CommunityPost[]
    all.unshift(post)
    localStorage.setItem("mf_community_posts", JSON.stringify(all))
  } catch { /* noop */ }
}

export default function LeaderComunidadPage() {
  const { community, loading, user } = useLeaderCommunity()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [newPost, setNewPost] = useState("")

  useEffect(() => {
    if (community?.id) setPosts(getPosts(community.id))
  }, [community?.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  const handlePost = () => {
    if (!newPost.trim() || !user || !community) return
    const post: CommunityPost = {
      id: `post-${Date.now()}`,
      communityId: community.id,
      authorName: user.name,
      authorEmail: user.email,
      content: newPost.trim(),
      timestamp: new Date().toISOString(),
      likes: 0,
    }
    addPost(post)
    setPosts((prev) => [post, ...prev])
    setNewPost("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comunidad</h1>
        <p className="text-sm text-muted-foreground">Publica anuncios y mensajes para tu equipo</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: `${community?.color || "#6366f1"}20` }}>
              <Shield className="h-4 w-4" style={{ color: community?.color || "#6366f1" }} />
            </div>
            <div className="flex-1">
              <textarea
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="Escribe un mensaje para tu comunidad..."
                rows={3}
                className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none resize-none"
              />
              <div className="flex justify-end mt-2">
                <Button size="sm" onClick={handlePost} disabled={!newPost.trim()} className="gap-1.5">
                  <Send className="h-3.5 w-3.5" />
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <Card key={post.id} className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary shrink-0">
                    {post.authorName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-foreground">{post.authorName}</span>
                      <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ backgroundColor: `${community?.color || "#6366f1"}20`, color: community?.color || "#6366f1" }}>
                        Lider
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(post.timestamp).toLocaleDateString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-foreground/80 whitespace-pre-wrap">{post.content}</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-400 transition-colors">
                        <Heart className="h-3 w-3" />
                        {post.likes}
                      </button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-border/50">
          <CardContent className="py-16 text-center">
            <MessagesSquare className="mx-auto h-12 w-12 text-muted-foreground/15" />
            <p className="mt-4 text-sm font-medium text-foreground">Se el primero en publicar algo</p>
            <p className="mt-1.5 text-xs text-muted-foreground">Las publicaciones de tu comunidad apareceran aqui.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
