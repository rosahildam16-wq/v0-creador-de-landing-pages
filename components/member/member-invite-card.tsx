"use client"

import { useState, useEffect } from "react"
import { Link2, Copy, Check, Plus, Trash2, Loader2, ExternalLink, Users, Clock, Infinity } from "lucide-react"

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Component ────────────────────────────────────────────────────────────────

export function MemberInviteCard({
  email,
  communitySlug,
  communityName,
  communityColor = "#8b5cf6",
}: Props) {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [error, setError] = useState("")

  const loadInvites = async () => {
    try {
      const res = await fetch(`/api/invites?email=${encodeURIComponent(email)}`)
      const data = await res.json()
      setInvites(data.invites ?? [])
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (email) loadInvites()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email])

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
      setError("Error de conexión")
    } finally {
      setCreating(false)
    }
  }

  const deactivateInvite = async (id: string) => {
    try {
      const res = await fetch(`/api/invites?id=${id}&email=${encodeURIComponent(email)}`, {
        method: "DELETE",
      })
      if (res.ok) {
        setInvites((prev) => prev.filter((i) => i.id !== id))
      }
    } catch {
      // silently ignore
    }
  }

  const copyUrl = async (invite: Invite) => {
    try {
      await navigator.clipboard.writeText(invite.invite_url)
    } catch {
      // Clipboard API may be blocked; fallback
      const ta = document.createElement("textarea")
      ta.value = invite.invite_url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const activeInvites = invites.filter((i) => i.is_active)

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.01] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl"
            style={{ background: `${communityColor}20`, border: `1px solid ${communityColor}30` }}
          >
            <Link2 className="h-4 w-4" style={{ color: communityColor }} />
          </div>
          <div>
            <p className="text-sm font-bold text-white">Links de invitación</p>
            <p className="text-[11px] text-violet-300/40">{communityName}</p>
          </div>
        </div>
        <button
          onClick={createInvite}
          disabled={creating}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none"
          style={{
            background: `${communityColor}18`,
            border: `1px solid ${communityColor}30`,
            color: communityColor,
          }}
        >
          {creating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Nuevo link
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 rounded-xl border border-amber-500/15 bg-amber-500/[0.05] px-4 py-2.5 text-xs text-amber-400">
          {error}
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-violet-400/30" />
        </div>
      ) : activeInvites.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-8 w-8 text-violet-400/20 mx-auto mb-2" />
          <p className="text-xs text-violet-300/30">No tienes links activos.</p>
          <p className="text-xs text-violet-300/20 mt-0.5">
            Crea uno y compártelo para hacer crecer tu equipo.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeInvites.map((invite) => (
            <InviteRow
              key={invite.id}
              invite={invite}
              communityColor={communityColor}
              copied={copiedId === invite.id}
              onCopy={() => copyUrl(invite)}
              onDelete={() => deactivateInvite(invite.id)}
            />
          ))}
        </div>
      )}

      {/* Footer hint */}
      <p className="mt-4 text-[10px] text-violet-300/20 text-center">
        Cada persona que se registre con tu link te acredita como su sponsor.
      </p>
    </div>
  )
}

// ─── Single invite row ────────────────────────────────────────────────────────

function InviteRow({
  invite,
  communityColor,
  copied,
  onCopy,
  onDelete,
}: {
  invite: Invite
  communityColor: string
  copied: boolean
  onCopy: () => void
  onDelete: () => void
}) {
  const [confirming, setConfirming] = useState(false)

  const usesLabel =
    invite.max_uses === 0
      ? "Ilimitados"
      : `${invite.uses}/${invite.max_uses}`

  const expiresLabel = invite.expires_at
    ? new Date(invite.expires_at).toLocaleDateString("es-ES", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      })
    : "Sin expiración"

  return (
    <div className="group relative rounded-xl border border-white/[0.05] bg-white/[0.01] hover:border-white/[0.10] p-3.5 transition-all">
      {/* URL + copy button */}
      <div className="flex items-center gap-2 mb-2">
        <code className="flex-1 text-[11px] text-violet-300/60 font-mono truncate">
          {invite.invite_url}
        </code>
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={onCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium transition-all"
            style={
              copied
                ? { background: "rgba(16,185,129,0.08)", color: "rgb(52,211,153)", border: "1px solid rgba(16,185,129,0.2)" }
                : { background: "rgba(255,255,255,0.03)", color: "rgba(167,139,250,0.6)", border: "1px solid rgba(255,255,255,0.06)" }
            }
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copiado" : "Copiar"}
          </button>
          <a
            href={invite.invite_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg text-violet-300/30 hover:text-violet-300/70 hover:bg-white/[0.04] transition-all"
            title="Abrir link"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[10px] text-violet-300/25">
        <span className="flex items-center gap-1">
          {invite.max_uses === 0 ? (
            <Infinity className="w-3 h-3" />
          ) : (
            <Users className="w-3 h-3" />
          )}
          {usesLabel} usos
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {expiresLabel}
        </span>

        {/* Delete — revealed on hover */}
        <span className="ml-auto">
          {confirming ? (
            <span className="flex items-center gap-2">
              <button
                onClick={() => { setConfirming(false); onDelete() }}
                className="text-red-400 hover:text-red-300 font-semibold"
              >
                Confirmar
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="text-violet-300/30 hover:text-violet-300/60"
              >
                Cancelar
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirming(true)}
              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-500/10 text-violet-300/25 hover:text-red-400 transition-all"
              title="Desactivar link"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </span>
      </div>
    </div>
  )
}
