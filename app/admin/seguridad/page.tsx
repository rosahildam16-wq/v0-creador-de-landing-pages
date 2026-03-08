"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { toast } from "sonner"
import {
  ShieldCheck,
  Loader2,
  Copy,
  Check,
  QrCode,
  Key,
  AlertTriangle,
  EyeOff,
  Eye,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SeguridadPage() {
  const { user } = useAuth()

  // Setup flow
  const [setupData, setSetupData] = useState<{
    secret: string
    otpauthUri: string
    backupCodes: string[]
  } | null>(null)
  const [setupLoading, setSetupLoading] = useState(false)

  // Verify flow
  const [code, setCode] = useState("")
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [verified, setVerified] = useState(false)

  // Backup codes visibility
  const [showBackup, setShowBackup] = useState(false)
  const [copiedCodes, setCopiedCodes] = useState(false)

  // Disable 2FA
  const [disableCode, setDisableCode] = useState("")
  const [disableLoading, setDisableLoading] = useState(false)

  const twoFAVerified = (user as Record<string, unknown> | null)?.twofa_verified === true

  async function handleSetup() {
    setSetupLoading(true)
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error al iniciar setup"); return }
      setSetupData(data)
    } catch { toast.error("Error de conexión") }
    finally { setSetupLoading(false) }
  }

  async function handleVerify() {
    if (!code.trim()) { toast.error("Ingresa el código"); return }
    setVerifyLoading(true)
    try {
      const res = await fetch("/api/auth/2fa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Código inválido"); return }
      toast.success("2FA habilitado correctamente")
      setVerified(true)
      setCode("")
    } catch { toast.error("Error de conexión") }
    finally { setVerifyLoading(false) }
  }

  async function handleDisable() {
    if (!disableCode.trim()) { toast.error("Ingresa el código TOTP"); return }
    setDisableLoading(true)
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: disableCode }),
      })
      const data = await res.json()
      if (!res.ok) { toast.error(data.error ?? "Error al deshabilitar"); return }
      toast.success("2FA deshabilitado")
      setDisableCode("")
      setSetupData(null)
      setVerified(false)
    } catch { toast.error("Error de conexión") }
    finally { setDisableLoading(false) }
  }

  function copyBackupCodes() {
    if (!setupData) return
    navigator.clipboard.writeText(setupData.backupCodes.join("\n"))
    setCopiedCodes(true)
    setTimeout(() => setCopiedCodes(false), 2000)
    toast.success("Códigos copiados al portapapeles")
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Seguridad — 2FA</h1>
          <p className="text-sm text-muted-foreground">
            Autenticación de dos factores obligatoria para cuentas admin
          </p>
        </div>
      </div>

      {/* Status */}
      <Card className="border-border/50">
        <CardContent className="p-5 flex items-center gap-4">
          {twoFAVerified || verified ? (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                <ShieldCheck className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="font-semibold text-emerald-400">2FA habilitado</p>
                <p className="text-xs text-muted-foreground">
                  Tu cuenta está protegida con autenticación de dos factores
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-amber-400">2FA no configurado</p>
                <p className="text-xs text-muted-foreground">
                  Tu cuenta admin requiere 2FA. Configúralo ahora.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Setup flow */}
      {!verified && !twoFAVerified && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <QrCode className="h-4 w-4 text-primary" />
              Configurar autenticador
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!setupData ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Usa una app como <strong className="text-foreground">Google Authenticator</strong>,{" "}
                  <strong className="text-foreground">Authy</strong> o{" "}
                  <strong className="text-foreground">1Password</strong> para escanear el código QR.
                </p>
                <Button onClick={handleSetup} disabled={setupLoading} className="gap-2">
                  {setupLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" />Generando...</>
                    : <><QrCode className="h-4 w-4" />Iniciar configuración</>
                  }
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* QR Code display */}
                <div className="space-y-2">
                  <Label className="text-xs">1. Escanea este código QR con tu app autenticadora</Label>
                  <div className="flex flex-col items-center rounded-xl border border-border/30 bg-white p-4 sm:w-fit">
                    {/* We show the otpauth URI as text since qrcode package is available */}
                    <div className="rounded bg-secondary/10 p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-2">URI para tu app autenticadora:</p>
                      <code className="block break-all text-[10px] text-foreground/80 max-w-xs">
                        {setupData.otpauthUri}
                      </code>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O ingresa la clave secreta manualmente:{" "}
                    <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs text-foreground">
                      {setupData.secret}
                    </code>
                  </p>
                </div>

                {/* Backup codes */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">2. Guarda tus códigos de respaldo (solo se muestran una vez)</Label>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 gap-1 text-[10px]"
                        onClick={() => setShowBackup(!showBackup)}
                      >
                        {showBackup ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showBackup ? "Ocultar" : "Mostrar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 gap-1 text-[10px]"
                        onClick={copyBackupCodes}
                      >
                        {copiedCodes ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                        Copiar
                      </Button>
                    </div>
                  </div>
                  {showBackup && (
                    <div className="grid grid-cols-2 gap-1.5 rounded-lg border border-border/30 bg-secondary/20 p-3">
                      {setupData.backupCodes.map((c) => (
                        <code key={c} className="font-mono text-xs text-foreground/80">{c}</code>
                      ))}
                    </div>
                  )}
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-2 text-xs text-amber-400">
                    Guarda estos códigos en un lugar seguro. Cada código es de un solo uso.
                  </div>
                </div>

                {/* Verify code */}
                <div className="space-y-2">
                  <Label className="text-xs">3. Ingresa el código de tu app para verificar</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="000 000"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      maxLength={6}
                      className="font-mono w-36 text-center text-lg tracking-widest"
                      onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                    />
                    <Button onClick={handleVerify} disabled={verifyLoading || code.length !== 6}>
                      {verifyLoading
                        ? <Loader2 className="h-4 w-4 animate-spin" />
                        : "Verificar"
                      }
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Disable 2FA (super_admin only) */}
      {(verified || twoFAVerified) && user?.role === "super_admin" && (
        <Card className="border-border/50 border-red-500/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-400 flex items-center gap-2">
              <Key className="h-4 w-4" />
              Deshabilitar 2FA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3 text-xs text-red-400">
              Solo disponible para super_admin. Requiere código TOTP actual para confirmar.
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Código TOTP"
                value={disableCode}
                onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                maxLength={6}
                className="font-mono w-36 text-center"
              />
              <Button
                variant="destructive"
                onClick={handleDisable}
                disabled={disableLoading || disableCode.length !== 6}
              >
                {disableLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Deshabilitar"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
