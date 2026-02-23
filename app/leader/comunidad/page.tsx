"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getCommunityById, getCommunityPosts, addCommunityPost, type CommunityPost } from "@/lib/communities-data"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessagesSquare, Send, Heart, Shield } from "lucide-react"

export default function LeaderComunidadPage() {
  const { user } = useAuth()
  const community = user?.communityId ? getCommunityById(user.communityId) : undefined
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [newPost, setNewPost] = useState("")

  useEffect(() => {
    if (user?.communityId) setPosts(getCommunityPosts(user.communityId))
  }, [user?.communityId])

  if (!community) return <p className="py-10 text-center text-muted-foreground">Comunidad no encontrada.</p>

  const handlePost = () => {
    if (!newPost.trim() || !user) return
    addCommunityPost({
      communityId: community.id,
      authorName: user.name,
      authorEmail: user.email,
      content: newPost.trim(),
      timestamp: new Date().toISOString(),
    })
    setPosts(getCommunityPosts(community.id))
    setNewPost("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Feed de {community.nombre}</h1>
        <p className="text-sm text-muted-foreground">Publica anuncios y mensajes para tu equipo</p>
      </div>

      {/* Post composer */}
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full shrink-0" style={{ backgroundColor: `${community.color}20` }}>
              <Shield className="h-4 w-4" style={{ color: community.color }} />
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

      {/* Posts */}
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
                      {post.authorEmail === community.leaderEmail && (
                        <span className="rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={{ backgroundColor: `${community.color}20`, color: community.color }}>
                          Lider
                        </span>
                      )}
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
            <MessagesSquare className="mx-auto h-10 w-10 text-muted-foreground/20" />
            <p className="mt-3 text-sm text-muted-foreground">Sin publicaciones aun.</p>
            <p className="mt-1 text-xs text-muted-foreground/60">Se el primero en publicar algo.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
