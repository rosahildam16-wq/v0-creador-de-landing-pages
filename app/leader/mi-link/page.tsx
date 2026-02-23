"use client"

import { useAuth } from "@/lib/auth-context"
import { getCommunityById } from "@/lib/communities-data"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link2, Copy, Check, Shield, Users } from "lucide-react"
import { useState } from "react"

export default function LeaderMiLinkPage() {
  const { user } = useAuth()
  const community = user?.communityId ? getCommunityById(user.communityId) : undefined
  const [copied, setCopied] = useState(false)

  if (!community) return <p className="py-10 text-center text-muted-foreground">Comunidad no encontrada.</p>

  const inviteUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/registro?code=${community.codigo}`

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Mi Link de Invitacion</h1>
        <p className="text-sm text-muted-foreground">Comparte este link para que nuevos miembros se unan a {community.nombre}</p>
      </div>

      <Card className="border-border/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl" style={{ backgroundColor: `${community.color}15` }}>
              <Shield className="h-6 w-6" style={{ color: community.color }} />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground">{community.nombre}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3 w-3" />
                Codigo de acceso: <span className="font-mono font-bold" style={{ color: community.color }}>{community.codigo}</span>
              </p>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground">Link de registro con codigo incluido</label>
            <div className="mt-2 flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-border/50 bg-secondary/50 px-4 py-3">
                <p className="text-sm text-foreground font-mono truncate">{inviteUrl}</p>
              </div>
              <Button onClick={handleCopy} className="gap-1.5 shrink-0">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copiado" : "Copiar"}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border border-border/30 bg-secondary/30 p-4">
            <p className="text-xs text-muted-foreground">
              Cuando alguien se registre usando este link (o ingrese el codigo <span className="font-mono font-bold">{community.codigo}</span> durante el registro), automaticamente se unira a tu comunidad con los embudos configurados habilitados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
