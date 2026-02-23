"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { getMemberCommunity, getCommunityPosts, addCommunityPost, getCommunityMembers, type Community, type CommunityPost, type CommunityMember } from "@/lib/communities-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, MessageSquare, Users, Shield } from "lucide-react"
import { cn } from "@/lib/utils"

export default function MemberComunidadPage() {
  const { user } = useAuth()
  const [community, setCommunity] = useState<Community | undefined>()
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [members, setMembers] = useState<CommunityMember[]>([])
  const [newPost, setNewPost] = useState("")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!user?.memberId) return
    const comm = getMemberCommunity(user.memberId)
    setCommunity(comm)
    if (comm) {
      setPosts(getCommunityPosts(comm.id))
      setMembers(getCommunityMembers(comm.id))
    }
  }, [user])

  const refreshPosts = () => {
    if (!community) return
    setPosts(getCommunityPosts(community.id))
    setMembers(getCommunityMembers(community.id))
  }

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
    refreshPosts()
  }

  if (!mounted) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  // No community assigned
  if (!community) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
        <div className="rounded-2xl border border-border/30 bg-card/40 p-8 max-w-md">
          <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-foreground mb-2">Sin comunidad asignada</h2>
          <p className="text-sm text-muted-foreground">
            Aun no perteneces a ninguna comunidad. Si tienes un codigo de acceso, puedes usarlo al registrarte para unirte automaticamente.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 rounded-full" style={{ backgroundColor: community.color }} />
        <div>
          <h1 className="text-xl font-bold text-foreground">{community.nombre}</h1>
          <p className="text-sm text-muted-foreground">{community.descripcion}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex gap-4">
        <div className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-card/40 px-3 py-2">
          <Users className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">{members.length} miembros</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-lg border border-border/30 bg-card/40 px-3 py-2">
          <MessageSquare className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-medium text-foreground">{posts.length} publicaciones</span>
        </div>
      </div>

      {/* Compose */}
      <Card className="border-border/50">
        <CardContent className="pt-4">
          <div className="flex gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </div>
            <input
              type="text"
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handlePost()}
              placeholder="Comparte algo con tu comunidad..."
              className="flex-1 rounded-lg border border-border/30 bg-muted/20 px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/40 focus:outline-none"
            />
            <Button size="sm" onClick={handlePost} disabled={!newPost.trim()} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Feed */}
      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="h-12 w-12 text-muted-foreground/20 mb-3" />
          <p className="text-sm text-muted-foreground">Aun no hay publicaciones.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Se el primero en compartir algo con tu comunidad.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => {
            const isOwn = post.authorEmail === user?.email
            return (
              <Card key={post.id} className={cn("border-border/30", isOwn && "border-primary/15 bg-primary/[0.02]")}>
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {post.authorName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{post.authorName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(post.timestamp).toLocaleDateString("es", {
                            day: "numeric",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm text-foreground/80">{post.content}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
