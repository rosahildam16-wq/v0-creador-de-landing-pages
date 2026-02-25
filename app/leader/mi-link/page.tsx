"use client"

import { useLeaderCommunity } from "@/hooks/use-leader-community"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link2, Copy, Check, Shield, Users, AtSign, Share2 } from "lucide-react"
import { useState } from "react"

export default function LeaderMiLinkPage() {
  const { community, loading, user } = useLeaderCommunity()
  const [copiedLink, setCopiedLink] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedReferral, setCopiedReferral] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    )
  }

  const baseUrl = typeof window !== "undefined" ? window.location.origin : ""
  const communityLink = `${baseUrl}/login?code=${community?.codigo || ""}`
  const referralLink = user?.username ? `${baseUrl}/login?ref=${user.username}` : ""

  const copy = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Link</h1>
        <p className="text-sm text-muted-foreground">Comparte tus links para que nuevos miembros se unan a {community?.nombre || "tu comunidad"}</p>
      </div>

      {/* Referral link */}
      {user?.username && (
        <Card className="border-primary/20">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <AtSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-lg font-bold text-foreground">Link de Referido Personal</p>
                <p className="text-xs text-muted-foreground">Quien se registre con este link quedara como tu referido directo</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Tu link de referido</label>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                  <p className="text-sm text-foreground font-mono truncate">{referralLink}</p>
                </div>
                <Button onClick={() => copy(referralLink, setCopiedReferral)} className="gap-1.5 shrink-0">
                  {copiedReferral ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
                  {copiedReferral ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Community invite link */}
      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${community?.color || "#6366f1"}15` }}>
              <Shield className="h-6 w-6" style={{ color: community?.color || "#6366f1" }} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{community?.nombre || "Tu comunidad"}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                Codigo de acceso: <span className="font-mono font-bold" style={{ color: community?.color || "#6366f1" }}>{community?.codigo || "N/A"}</span>
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Link de registro con codigo incluido</label>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-border/50 bg-secondary/50 px-4 py-3">
                <p className="text-sm text-foreground font-mono truncate">{communityLink}</p>
              </div>
              <Button variant="outline" onClick={() => copy(communityLink, setCopiedLink)} className="gap-1.5 shrink-0">
                {copiedLink ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copiedLink ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>

          {community?.codigo && (
            <div>
              <label className="text-xs font-medium text-muted-foreground">Solo el codigo</label>
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 rounded-lg border border-border/50 bg-secondary/50 px-4 py-3">
                  <p className="text-sm text-foreground font-mono">{community.codigo}</p>
                </div>
                <Button variant="outline" onClick={() => copy(community.codigo!, setCopiedCode)} className="gap-1.5 shrink-0">
                  {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copiedCode ? "Copiado" : "Copiar"}
                </Button>
              </div>
            </div>
          )}

          <div className="rounded-lg border border-border/30 bg-secondary/30 p-4">
            <p className="text-xs text-muted-foreground">
              Cuando alguien se registre usando tu link de referido o ingrese el codigo <span className="font-mono font-bold">{community?.codigo}</span> durante el registro, automaticamente se unira a tu comunidad.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
