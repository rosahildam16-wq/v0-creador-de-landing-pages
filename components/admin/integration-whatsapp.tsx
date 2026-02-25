"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  MessageSquare,
  CheckCircle2,
  XCircle,
  LogOut,
  Zap,
  QrCode,
  Smartphone,
  Wifi,
  WifiOff,
  RefreshCw,
  Send,
  Shield,
  Clock,
  AlertTriangle,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react"

type ConnectStatus = "loading" | "idle" | "qr-loading" | "qr-ready" | "connected" | "error" | "no-server"

export function IntegrationWhatsApp() {
  const [status, setStatus] = useState<ConnectStatus>("loading")
  const [connectedPhone, setConnectedPhone] = useState("")
  const [qrImage, setQrImage] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [qrTimer, setQrTimer] = useState(60)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [testNumber, setTestNumber] = useState("")
  const [testMessage, setTestMessage] = useState("Hola! Este es un mensaje de prueba desde Nomada CRM.")
  const [sendStatus, setSendStatus] = useState<"idle" | "sending" | "sent" | "error">("idle")

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  // Check status on mount
  useEffect(() => {
    checkStatus()
  }, [])

  // QR timer countdown
  useEffect(() => {
    if (status !== "qr-ready") return
    if (qrTimer <= 0) {
      // QR expired, refresh
      fetchQR()
      return
    }
    const interval = setInterval(() => {
      setQrTimer((prev) => prev - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [status, qrTimer])

  // Poll for connection while QR is showing
  useEffect(() => {
    if (status !== "qr-ready") return
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/integrations/whatsapp?action=status")
        const data = await res.json()
        if (data.connected) {
          setConnectedPhone(data.phone || "")
          setStatus("connected")
        }
      } catch {
        // Keep polling
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [status])

  const checkStatus = async () => {
    try {
      const res = await fetch("/api/integrations/whatsapp?action=status")
      const data = await res.json()

      if (data.connected) {
        setConnectedPhone(data.phone || "")
        setStatus("connected")
      } else if (data.serverConfigured === false) {
        setStatus("no-server")
      } else {
        setStatus("idle")
      }
    } catch {
      setStatus("idle")
    }
  }

  const fetchQR = useCallback(async () => {
    setStatus("qr-loading")
    setErrorMsg("")
    try {
      const res = await fetch("/api/integrations/whatsapp?action=qr")
      const data = await res.json()

      if (data.error) {
        if (res.status === 400) {
          setStatus("no-server")
          return
        }
        setErrorMsg(data.error)
        setStatus("error")
        return
      }

      if (data.status === "connected") {
        setConnectedPhone(data.phone || "")
        setStatus("connected")
        return
      }

      if (data.qr) {
        setQrImage(data.qr)
        setQrTimer(60)
        setStatus("qr-ready")
      }
    } catch {
      setErrorMsg("No se pudo conectar al servidor de WhatsApp.")
      setStatus("error")
    }
  }, [])

  const handleDisconnect = async () => {
    try {
      await fetch("/api/integrations/whatsapp", { method: "DELETE" })
    } catch {
      // Continue
    }
    setStatus("idle")
    setConnectedPhone("")
    setQrImage("")
  }

  const handleSendTest = async () => {
    if (!testNumber || !testMessage) return
    setSendStatus("sending")
    try {
      const res = await fetch("/api/integrations/whatsapp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: testNumber, message: testMessage }),
      })
      const data = await res.json()
      if (data.success) {
        setSendStatus("sent")
        setTimeout(() => setSendStatus("idle"), 3000)
      } else {
        setSendStatus("error")
        setTimeout(() => setSendStatus("idle"), 3000)
      }
    } catch {
      setSendStatus("error")
      setTimeout(() => setSendStatus("idle"), 3000)
    }
  }

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
            <MessageSquare className="h-5 w-5 text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">WhatsApp</h2>
            <p className="text-xs text-muted-foreground">Verificando conexion...</p>
          </div>
        </div>
        <Card className="border-border/50">
          <CardContent className="flex items-center justify-center p-12">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
          <MessageSquare className="h-5 w-5 text-emerald-500" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">WhatsApp</h2>
          <p className="text-xs text-muted-foreground">Conecta escaneando un codigo QR, como WhatsApp Web</p>
        </div>
        {status === "connected" && (
          <Badge variant="outline" className="ml-auto border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="mr-1 h-3 w-3" /> Conectado
          </Badge>
        )}
      </div>

      {/* Connection Card */}
      <Card className="border-border/50">
        <CardContent className="flex flex-col items-center gap-5 p-8">

          {/* No server configured */}
          {status === "no-server" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/10">
                <AlertTriangle className="h-8 w-8 text-amber-500" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-foreground">Servidor de WhatsApp requerido</h3>
                <p className="mt-1 max-w-md text-sm text-muted-foreground">
                  Para conectar WhatsApp sin API necesitas un servidor Node.js corriendo whatsapp-web.js. Este servidor maneja la conexion con WhatsApp Web.
                </p>
              </div>
            </>
          )}

          {/* Idle state */}
          {status === "idle" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <QrCode className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-foreground">Conecta tu WhatsApp</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Escanea un codigo QR con tu celular para vincular tu WhatsApp, como en WhatsApp Web.
                </p>
              </div>
              <button
                onClick={fetchQR}
                className="flex items-center gap-3 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow-md"
              >
                <QrCode className="h-5 w-5" />
                Mostrar codigo QR
              </button>
              <p className="text-[10px] text-muted-foreground">
                No necesitas API ni cuenta de Meta Business. Solo tu telefono con WhatsApp.
              </p>
            </>
          )}

          {/* Loading QR */}
          {status === "qr-loading" && (
            <>
              <div className="flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-dashed border-border/50 bg-secondary/20">
                <RefreshCw className="h-8 w-8 animate-spin text-emerald-500" />
              </div>
              <p className="text-sm text-muted-foreground">Generando codigo QR...</p>
            </>
          )}

          {/* QR Ready - Real QR image from server */}
          {status === "qr-ready" && (
            <>
              {qrImage ? (
                <div className="relative flex flex-col items-center gap-3">
                  <div className="relative overflow-hidden rounded-2xl border-2 border-border/50 bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={qrImage}
                      alt="QR para vincular WhatsApp"
                      className="h-52 w-52"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex h-52 w-52 items-center justify-center rounded-2xl border-2 border-border/50 bg-secondary/20">
                  <QrCode className="h-12 w-12 text-muted-foreground" />
                </div>
              )}

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>El QR se refresca en {qrTimer}s</span>
              </div>

              <div className="w-full max-w-xs">
                <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-secondary/20 p-4">
                  <h4 className="text-xs font-semibold text-foreground">Como escanear:</h4>
                  <div className="flex flex-col gap-2">
                    <StepItem number={1}>Abre WhatsApp en tu celular</StepItem>
                    <StepItem number={2}>
                      {"Toca Menu ("}
                      <span className="font-mono text-foreground">...</span>
                      {") o Configuracion"}
                    </StepItem>
                    <StepItem number={3}>
                      {"Selecciona "}
                      <span className="font-medium text-foreground">Dispositivos vinculados</span>
                    </StepItem>
                    <StepItem number={4}>
                      {"Toca "}
                      <span className="font-medium text-foreground">Vincular un dispositivo</span>
                    </StepItem>
                    <StepItem number={5}>Apunta la camara al codigo QR</StepItem>
                  </div>
                </div>
              </div>

              <button
                onClick={fetchQR}
                className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Generar nuevo QR
              </button>
            </>
          )}

          {/* Connected */}
          {status === "connected" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10">
                <CheckCircle2 className="h-8 w-8 text-emerald-500" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-foreground">WhatsApp conectado</h3>
                {connectedPhone && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Numero: <span className="font-medium text-emerald-400">{connectedPhone}</span>
                  </p>
                )}
              </div>
              <div className="flex w-full max-w-xs items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                <Wifi className="h-4 w-4 shrink-0 text-emerald-500" />
                <div>
                  <p className="text-xs font-medium text-emerald-400">Sesion activa</p>
                  <p className="text-[10px] text-muted-foreground">Tu telefono debe estar conectado a internet</p>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={fetchQR}
                  className="flex items-center gap-2 rounded-lg border border-border/50 bg-card px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Reconectar
                </button>
                <button
                  onClick={handleDisconnect}
                  className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-xs font-medium text-destructive transition-colors hover:bg-destructive/10"
                >
                  <LogOut className="h-3.5 w-3.5" /> Desconectar
                </button>
              </div>
            </>
          )}

          {/* Error */}
          {status === "error" && (
            <>
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div className="text-center">
                <h3 className="text-base font-semibold text-foreground">Error de conexion</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">{errorMsg}</p>
              </div>
              <button
                onClick={fetchQR}
                className="flex items-center gap-3 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-500 hover:shadow-md"
              >
                <QrCode className="h-5 w-5" />
                Reintentar
              </button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Test message - only when connected */}
      {status === "connected" && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Send className="h-4 w-4 text-emerald-500" />
              Enviar mensaje de prueba
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Numero (con codigo de pais)</label>
              <input
                type="text"
                value={testNumber}
                onChange={(e) => setTestNumber(e.target.value)}
                placeholder="+573001112233"
                className="rounded-lg border border-border/50 bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-muted-foreground">Mensaje</label>
              <textarea
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={2}
                className="rounded-lg border border-border/50 bg-card px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-emerald-500/50 focus:outline-none focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
            <button
              onClick={handleSendTest}
              disabled={!testNumber || sendStatus === "sending"}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:opacity-50"
            >
              {sendStatus === "sending" && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
              {sendStatus === "sent" && <CheckCircle2 className="h-3.5 w-3.5" />}
              {sendStatus === "error" && <XCircle className="h-3.5 w-3.5" />}
              {sendStatus === "idle" && <Send className="h-3.5 w-3.5" />}
              {sendStatus === "sending" ? "Enviando..." : sendStatus === "sent" ? "Enviado" : sendStatus === "error" ? "Error al enviar" : "Enviar mensaje de prueba"}
            </button>
          </CardContent>
        </Card>
      )}

      {/* Setup guide */}
      {(status === "no-server" || status === "idle" || status === "error") && (
        <Card className="border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Configuracion del servidor WhatsApp
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Necesitas un servidor Node.js corriendo whatsapp-web.js. Este servidor mantiene la sesion activa y maneja los mensajes.
            </p>

            {/* Server setup code */}
            <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-secondary/20 p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold text-foreground">server.js</h4>
                <button
                  onClick={() => copyToClipboard(SERVER_CODE, "server")}
                  className="flex items-center gap-1.5 rounded px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {copiedField === "server" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                  {copiedField === "server" ? "Copiado" : "Copiar"}
                </button>
              </div>
              <pre className="overflow-x-auto rounded-lg bg-card p-3 text-[11px] leading-relaxed text-muted-foreground">
                <code>{SERVER_CODE}</code>
              </pre>
            </div>

            <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-secondary/20 p-4">
              <h4 className="text-xs font-semibold text-foreground">Pasos para configurar:</h4>
              <SetupStep number={1}>
                Crea una carpeta y ejecuta: <code className="rounded bg-card px-1.5 py-0.5 text-[10px] text-foreground">npm init -y</code>
              </SetupStep>
              <SetupStep number={2}>
                Instala dependencias: <code className="rounded bg-card px-1.5 py-0.5 text-[10px] text-foreground">npm install whatsapp-web.js express qrcode cors</code>
              </SetupStep>
              <SetupStep number={3}>
                Copia el codigo de server.js y ejecuta: <code className="rounded bg-card px-1.5 py-0.5 text-[10px] text-foreground">node server.js</code>
              </SetupStep>
              <SetupStep number={4}>
                Agrega la variable de entorno en Vars:
                <br />
                <code className="mt-1 inline-block rounded bg-card px-1.5 py-0.5 text-[10px] text-foreground">
                  WHATSAPP_SERVER_URL=http://localhost:3001
                </code>
              </SetupStep>
              <SetupStep number={5}>
                Para produccion, despliega el servidor en un VPS (DigitalOcean, Railway, etc.) y usa esa URL
              </SetupStep>
            </div>

            <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <p className="text-[10px] leading-relaxed text-muted-foreground">
                El servidor debe correr en un proceso persistente (no serverless). Necesita Puppeteer/Chromium para emular WhatsApp Web. Funciona bien en cualquier VPS con al menos 1GB de RAM.
              </p>
            </div>

            <a
              href="https://docs.wwebjs.dev/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-emerald-400 transition-colors hover:text-emerald-300"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Documentacion oficial de whatsapp-web.js
            </a>
          </CardContent>
        </Card>
      )}

      {/* What it does */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Zap className="h-4 w-4 text-emerald-500" />
            Que hace esta integracion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 sm:grid-cols-2">
            <FeatureItem icon={<Send className="h-3.5 w-3.5 text-emerald-500" />} title="Mensajes automaticos" desc="Envia confirmaciones y recordatorios desde tu WhatsApp" />
            <FeatureItem icon={<Smartphone className="h-3.5 w-3.5 text-emerald-500" />} title="Tu numero personal" desc="Los mensajes se envian desde tu numero, no un numero desconocido" />
            <FeatureItem icon={<Zap className="h-3.5 w-3.5 text-emerald-500" />} title="Activado por workflows" desc="Se dispara cuando un lead agenda, cancela o reprograma" />
            <FeatureItem icon={<Shield className="h-3.5 w-3.5 text-emerald-500" />} title="Sin costo de API" desc="No necesitas pagar por Meta Business API ni verificacion" />
          </div>
        </CardContent>
      </Card>

      {/* Connection warning */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/5 p-4">
        <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
        <div>
          <p className="text-xs font-medium text-amber-400">Mantener telefono conectado</p>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Tu celular debe tener conexion a internet para que los mensajes se envien. La sesion puede cerrarse si el telefono queda desconectado por mucho tiempo.
          </p>
        </div>
      </div>

      {/* Security note */}
      <div className="flex items-start gap-3 rounded-lg border border-border/50 bg-secondary/20 p-4">
        <Shield className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
        <div>
          <p className="text-xs font-medium text-foreground">Conexion encriptada</p>
          <p className="text-[10px] leading-relaxed text-muted-foreground">
            La conexion usa el mismo cifrado de extremo a extremo de WhatsApp. Tus mensajes son privados. Puedes cerrar la sesion desde tu telefono en cualquier momento.
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureItem({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-secondary/20 p-3">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-xs font-medium text-foreground">{title}</p>
        <p className="text-[10px] leading-relaxed text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

function StepItem({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400">
        {number}
      </span>
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

function SetupStep({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-[10px] font-bold text-emerald-400">{number}</span>
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

const SERVER_CODE = `const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const QRCode = require('qrcode');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

let currentQR = null;
let isReady = false;
let clientInfo = null;

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
});

client.on('qr', (qr) => {
  currentQR = qr;
  isReady = false;
  console.log('QR code generated');
});

client.on('ready', () => {
  isReady = true;
  currentQR = null;
  clientInfo = client.info;
  console.log('WhatsApp connected:', clientInfo.pushname);
});

client.on('disconnected', () => {
  isReady = false;
  clientInfo = null;
  client.initialize();
});

// GET /status
app.get('/status', (req, res) => {
  res.json({
    connected: isReady,
    phone: clientInfo?.wid?.user || null,
    name: clientInfo?.pushname || null
  });
});

// GET /qr
app.get('/qr', async (req, res) => {
  if (isReady) return res.json({ connected: true, phone: clientInfo?.wid?.user });
  if (!currentQR) return res.json({ qr: null, status: 'waiting' });
  res.json({ qr: currentQR, status: 'qr-ready' });
});

// POST /send
app.post('/send', async (req, res) => {
  const { number, message } = req.body;
  if (!isReady) return res.status(503).json({ error: 'WhatsApp not connected' });
  try {
    const chatId = number.replace('+','') + '@c.us';
    await client.sendMessage(chatId, message);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /disconnect
app.post('/disconnect', async (req, res) => {
  await client.logout();
  res.json({ success: true });
});

client.initialize();
app.listen(3001, () => console.log('WhatsApp server on port 3001'));`
