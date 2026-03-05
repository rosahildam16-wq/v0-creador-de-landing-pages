"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link2, Copy, Check, Plus, Trash2, Loader2, ExternalLink } from "lucide-react"

interface Invite {
  id: string
  token: string
  community_id: string
  community_name: string
  community_slug: string
  community_color: string
  invite_url: string
  uses: number
  max_uses: number
  uses_remaining: number | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

interface Props {
  email: string
  communitySlug: string
  communityName: string
  communityColor?: string
}

export function MemberInviteCard({ email, communitySlug, communityName, communityColor = "#8b5cf6" }: Props) {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const loadInvites = async () => {
    if (loaded) return
    setLoading(true)
    try {
      const res = await fetch(`/api/invites?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setInvites(data.invites ?? [])
      setLoaded(true)
    } catch {
      setError("No se pudieron cargar tus invitaciones")
    } finally {
      setLoading(false)
    }
  }

  const createInvite = async () => {
    setCreating(true)
    setError("")
    try {
      const res = await fetch("/api/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, max_uses: 0 }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al crear invitación")
      } else {
        setInvites((prev) => [data.invite, ...prev])
      }
    } catch {
      setError("Error de red al crear invitación")
    } finally {
      setCreating(false)
    }
  }

  const deactivateInvite = async (id: string) => {
    const res = await fetch(`/api/invites?id=${id}&email=${encodeURIComponent(email)}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setInvites((prev) => prev.filter((i) => i.id !== id))
    }
  }

  const copyUrl = (invite: Invite) => {
    navigator.clipboard.writeText(invite.invite_url)
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Load on first render
  if (!loaded && !loading) {
    loadInvites()
  }

  const activeInvites = invites.filter((i) => i.is_active)

  return (
    <Card className="border-border/50">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{ background: `${communityColor}20` }}
            >
              <Link2 className="h-4 w-4" style={{ color: communityColor }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Mis links de invitación</p>
              <p className="text-xs text-muted-foreground">{communityName}</p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={createInvite}
            disabled={creating}
            className="gap-1.5 text-xs h-8"
          >
            {creating ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
            Nuevo link
          </Button>
        </div>

        {error && (
          <p className="text-xs text-amber-400 bg-amber-500/10 px-3 py-2 rounded-lg">{error}</p>
        )}

        {loading && (
          <div className="flex justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && activeInvites.length === 0 && (
          <div className="text-center py-6">
            <Link2 className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">No tienes links activos.</p>
            <p className="text-xs text-muted-foreground/60">Crea uno para invitar personas a tu equipo.</p>
          </div>
        )}

        <div className="space-y-2">
          {activeInvites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center gap-2 rounded-xl border border-border/40 bg-card/50 px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono text-foreground/80 truncate">{invite.invite_url}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-[10px] text-muted-foreground/60">
                    {invite.uses} uso{invite.uses !== 1 ? "s" : ""}
                    {invite.max_uses > 0 ? ` / ${invite.max_uses}` : ""}
                  </span>
                  {invite.expires_at && (
                    <span className="text-[10px] text-amber-400/60">
                      Expira {new Date(invite.expires_at).toLocaleDateString("es-ES")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => copyUrl(invite)}
                  className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                  title="Copiar link"
                >
                  {copiedId === invite.id ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
                <a
                  href={invite.invite_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-lg hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition-colors"
                  title="Abrir link"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => deactivateInvite(invite.id)}
                  className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
                  title="Desactivar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
