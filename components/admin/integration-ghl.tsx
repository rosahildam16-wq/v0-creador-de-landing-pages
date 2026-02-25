"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { normalizePhone } from "@/lib/phone-utils"
import {
  CheckCircle2,
  XCircle,
  Send,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Plug,
  MessageSquare,
  Mail,
  Webhook,
  Key,
  Building2,
  X,
  Plus,
  Bug,
  Clock,
  ChevronDown,
  ChevronUp,
  Save,
  Loader2,
  LinkIcon,
  Shuffle,
  UserPlus,
  RefreshCcw,
  Settings,
  History,
  RotateCcw,
  Activity,
} from "lucide-react"

type TestStatus = "idle" | "testing" | "success" | "error"

const EVENTS = [
  { value: "lead_created", label: "lead_created", autoTag: "mf-lead" },
  { value: "quiz_completed", label: "quiz_completed", autoTag: "mf-quiz" },
  { value: "vsl_started", label: "vsl_started", autoTag: "mf-vsl-start" },
  { value: "vsl_25", label: "vsl_25", autoTag: "mf-vsl-25" },
  { value: "vsl_75", label: "vsl_75", autoTag: "mf-vsl-75" },
  { value: "booking_intent", label: "booking_intent", autoTag: "mf-booking-intent" },
  { value: "booking_completed", label: "booking_completed", autoTag: "mf-booking-completed" },
] as const

const FUNNEL_STEPS = [
  { value: "landing_view", label: "landing_view" },
  { value: "quiz", label: "quiz" },
  { value: "vsl", label: "vsl" },
  { value: "booking", label: "booking" },
  { value: "checkout", label: "checkout" },
  { value: "thank_you", label: "thank_you" },
] as const

const SYSTEM_TAGS = ["magic-funnel", "mf-ghl"] as const

interface DebugInfo {
  status: string
  httpCode: number | null
  responseTime?: string
  responseBody: string | null
  error?: string
  payloadSent: Record<string, unknown> | null
  headersSent?: Record<string, string>
}

export function IntegrationGHL() {
  // Webhook URL editable field
  const [webhookUrl, setWebhookUrl] = useState("")
  const [webhookUrlSaved, setWebhookUrlSaved] = useState("")
  const [savingUrl, setSavingUrl] = useState(false)
  const [urlSaveStatus, setUrlSaveStatus] = useState<"idle" | "saved" | "error">("idle")
  const [urlError, setUrlError] = useState("")

  // Webhook config state
  const [defaultTags, setDefaultTags] = useState<string[]>(["nomada-vip"])
  const [tagInput, setTagInput] = useState("")
  const [source, setSource] = useState("magic-funnel")
  const [eventName, setEventName] = useState("lead_created")
  const [funnelStep, setFunnelStep] = useState("landing_view")
  const [phoneCountryCode, setPhoneCountryCode] = useState("+57")

  // API v2 credentials
  const [apiKey, setApiKey] = useState("")
  const [apiKeyMasked, setApiKeyMasked] = useState("")
  const [apiKeySet, setApiKeySet] = useState(false)
  const [locationId, setLocationId] = useState("")
  const [locationIdSet, setLocationIdSet] = useState(false)
  const [savingApi, setSavingApi] = useState(false)
  const [apiSaveStatus, setApiSaveStatus] = useState<"idle" | "saved" | "error">("idle")
  const [apiSaveError, setApiSaveError] = useState("")
  const [apiConnected, setApiConnected] = useState(false)

  // API v2 test payload (editable)
  type ApiTestMode = "create" | "upsert"
  const [apiTestMode, setApiTestMode] = useState<ApiTestMode>("create")
  const [testFirstName, setTestFirstName] = useState("Test")
  const [testLastName, setTestLastName] = useState("MagicFunnel")
  const [testEmail, setTestEmail] = useState("")
  const [testPhone, setTestPhone] = useState("")
  const [testSource, setTestSource] = useState("magic-funnel")
  const [testTags, setTestTags] = useState<string[]>(["magic-funnel", "mf-api-test"])
  const [testTagInput, setTestTagInput] = useState("")

  // Advanced settings
  const [baseUrl, setBaseUrl] = useState("https://services.leadconnectorhq.com")
  const [apiVersion, setApiVersion] = useState("2021-07-28")
  const [defaultSource, setDefaultSource] = useState("magic-funnel")
  const [timeoutMs, setTimeoutMs] = useState(10000)
  const [retryCount, setRetryCount] = useState(2)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Execution logs
  interface ExecLog {
    id: string
    timestamp: string
    embudoId: string
    embudoNombre?: string
    leadEmail: string
    leadNombre: string
    method: "api" | "webhook"
    action: string
    status: "success" | "error" | "rejected"
    httpCode: number | null
    contactId: string | null
    attempt: number
    maxAttempts: number
    elapsed: string
    tag: string
  }
  const [execLogs, setExecLogs] = useState<ExecLog[]>([])
  const [execStats, setExecStats] = useState({ total: 0, success: 0, errors: 0, rejected: 0 })
  const [logsLoading, setLogsLoading] = useState(false)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  // API v2 test log
  interface ApiLog {
    action: string
    status: string
    message: string
    httpCode: number | null
    contactId?: string | null
    responseBody?: string | null
    payloadSent?: Record<string, unknown> | null
    elapsed?: string
  }
  const [apiLog, setApiLog] = useState<ApiLog | null>(null)
  const [apiLogExpanded, setApiLogExpanded] = useState(true)

  // Test states
  const [webhookTestStatus, setWebhookTestStatus] = useState<TestStatus>("idle")
  const [apiTestStatus, setApiTestStatus] = useState<TestStatus>("idle")
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Debug
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)
  const [debugExpanded, setDebugExpanded] = useState(true)

  // Load saved config on mount
  useEffect(() => {
    fetch("/api/integrations/ghl-config")
      .then((res) => res.json())
      .then((data) => {
        if (data.webhookUrl) {
          setWebhookUrl(data.webhookUrl)
          setWebhookUrlSaved(data.webhookUrl)
        }
        if (data.apiKeySet) {
          setApiKeySet(true)
          setApiKeyMasked(data.apiKey || "")
        }
        if (data.locationIdSet) {
          setLocationIdSet(true)
          setLocationId(data.locationId || "")
        }
        if (data.apiKeySet && data.locationIdSet) {
          setApiConnected(true)
        }
        // Advanced
        if (data.baseUrl) setBaseUrl(data.baseUrl)
        if (data.apiVersion) setApiVersion(data.apiVersion)
        if (data.defaultSource) setDefaultSource(data.defaultSource)
        if (data.timeoutMs) setTimeoutMs(data.timeoutMs)
        if (data.retryCount != null) setRetryCount(data.retryCount)
      })
      .catch(() => {})
  }, [])

  // Load execution logs
  const loadLogs = useCallback(async () => {
    setLogsLoading(true)
    try {
      const res = await fetch("/api/admin/ghl-logs?limit=30")
      const data = await res.json()
      setExecLogs(data.logs || [])
      setExecStats(data.stats || { total: 0, success: 0, errors: 0, rejected: 0 })
    } catch { /* ignore */ }
    finally { setLogsLoading(false) }
  }, [])

  useEffect(() => { loadLogs() }, [loadLogs])

  const saveWebhookUrl = async () => {
    setSavingUrl(true)
    setUrlSaveStatus("idle")
    setUrlError("")
    try {
      const res = await fetch("/api/integrations/ghl-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl }),
      })
      const data = await res.json()
      if (data.success) {
        setWebhookUrlSaved(webhookUrl)
        setUrlSaveStatus("saved")
        setTimeout(() => setUrlSaveStatus("idle"), 3000)
      } else {
        setUrlError(data.error || "Error al guardar")
        setUrlSaveStatus("error")
      }
    } catch {
      setUrlError("Error de red al guardar")
      setUrlSaveStatus("error")
    } finally {
      setSavingUrl(false)
    }
  }

  const hasUnsavedUrl = webhookUrl !== webhookUrlSaved
  const isWebhookConfigured = webhookUrlSaved.length > 0

  // Auto-tags: system tags + event-specific tag + user default tags
  const computedTags = useMemo(() => {
    const eventAutoTag = EVENTS.find((e) => e.value === eventName)?.autoTag ?? ""
    const tags = [...SYSTEM_TAGS, ...(eventAutoTag ? [eventAutoTag] : []), ...defaultTags]
    // Deduplicate
    return [...new Set(tags)]
  }, [eventName, defaultTags])

  // Full payload preview (exactly what will be sent)
  const previewPayload = useMemo(() => ({
    first_name: "Test",
    last_name: "",
    email: "test@mail.com",
    phone: normalizePhone("300 111 2233", phoneCountryCode),
    source,
    tags: computedTags,
    event: eventName,
    funnel_step: funnelStep,
    timestamp: new Date().toISOString(),
  }), [source, computedTags, eventName, funnelStep, phoneCountryCode])

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const addTag = useCallback(() => {
    const trimmed = tagInput.trim()
    if (trimmed && !defaultTags.includes(trimmed)) {
      setDefaultTags((prev) => [...prev, trimmed])
      setTagInput("")
    }
  }, [tagInput, defaultTags])

  const removeTag = (tag: string) => {
    setDefaultTags((prev) => prev.filter((t) => t !== tag))
  }

  const testWebhook = async () => {
    setWebhookTestStatus("testing")
    setDebugInfo(null)
    try {
      const res = await fetch("/api/integrations/ghl-webhook-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          webhookUrl: webhookUrlSaved,
          computedTags,
          source,
          eventName,
          funnelStep,
          phoneCountryCode,
        }),
      })
      const data = await res.json()
      setDebugInfo(data.debug)
      setWebhookTestStatus(data.success ? "success" : "error")
    } catch (err) {
      setDebugInfo({
        status: "error",
        httpCode: null,
        responseBody: null,
        error: err instanceof Error ? err.message : "Error de red",
        payloadSent: null,
      })
      setWebhookTestStatus("error")
    }
  }

  // Generate unique test data
  const generateUniqueData = useCallback(() => {
    const ts = Date.now()
    const rand = Math.floor(Math.random() * 9000 + 1000)
    setTestFirstName("Test")
    setTestLastName(`MF-${rand}`)
    setTestEmail(`test-${ts}@magicfunnel.test`)
    setTestPhone(`+5730000${String(ts).slice(-5)}`)
    setTestSource("magic-funnel")
    setTestTags(["magic-funnel", "mf-api-test"])
  }, [])

  // Initialize with unique data on mount
  useEffect(() => {
    generateUniqueData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const addTestTag = useCallback(() => {
    const trimmed = testTagInput.trim()
    if (trimmed && !testTags.includes(trimmed)) {
      setTestTags((prev) => [...prev, trimmed])
      setTestTagInput("")
    }
  }, [testTagInput, testTags])

  const removeTestTag = (tag: string) => {
    setTestTags((prev) => prev.filter((t) => t !== tag))
  }

  const saveAdvancedConfig = async () => {
    try {
      await fetch("/api/integrations/ghl-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, apiVersion, defaultSource, timeoutMs, retryCount }),
      })
    } catch { /* ignore */ }
  }

  const retryLog = async (logId: string) => {
    setRetryingId(logId)
    try {
      await fetch("/api/admin/ghl-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logId }),
      })
      await loadLogs()
    } catch { /* ignore */ }
    finally { setRetryingId(null) }
  }

  const saveApiCredentials = async () => {
    setSavingApi(true)
    setApiSaveStatus("idle")
    setApiSaveError("")
    try {
      const payload: Record<string, string> = {}
      if (apiKey.trim()) payload.apiKey = apiKey
      if (locationId.trim()) payload.locationId = locationId

      const res = await fetch("/api/integrations/ghl-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (data.success) {
        setApiKeySet(data.apiKeySet)
        setApiKeyMasked(data.apiKey || "")
        setLocationIdSet(data.locationIdSet)
        setLocationId(data.locationId || "")
        setApiKey("") // Clear raw key from state
        setApiConnected(data.apiKeySet && data.locationIdSet)
        setApiSaveStatus("saved")
        setTimeout(() => setApiSaveStatus("idle"), 3000)
      } else {
        setApiSaveError(data.error || "Error al guardar")
        setApiSaveStatus("error")
      }
    } catch {
      setApiSaveError("Error de red al guardar")
      setApiSaveStatus("error")
    } finally {
      setSavingApi(false)
    }
  }

  const testApi = async () => {
    setApiTestStatus("testing")
    setApiLog(null)
    try {
      const res = await fetch("/api/integrations/ghl-api-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      const data = await res.json()
      setApiLog(data.log)
      if (data.success) {
        setApiTestStatus("success")
        setApiConnected(true)
      } else {
        setApiTestStatus("error")
      }
    } catch (err) {
      setApiLog({
        action: "unknown",
        status: "error",
        message: err instanceof Error ? err.message : "Error de red",
        httpCode: null,
      })
      setApiTestStatus("error")
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <Building2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-foreground">GoHighLevel</h2>
          <p className="text-xs text-muted-foreground">Conecta con GHL para automatizar mensajes de WhatsApp, SMS y correos</p>
        </div>
      </div>

      {/* How it works */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Plug className="h-4 w-4 text-primary" />
            Como funciona la integracion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 p-3 text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                <span className="text-xs font-bold text-primary">1</span>
              </div>
              <p className="text-xs font-medium text-foreground">Lead completa el quiz</p>
              <p className="text-[10px] text-muted-foreground">Datos capturados automaticamente</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 p-3 text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10">
                <span className="text-xs font-bold text-emerald-500">2</span>
              </div>
              <p className="text-xs font-medium text-foreground">Datos enviados a GHL</p>
              <p className="text-[10px] text-muted-foreground">Via webhook con payload enriquecido</p>
            </div>
            <div className="flex flex-col items-center gap-2 rounded-lg border border-border/50 bg-secondary/30 p-3 text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                <span className="text-xs font-bold text-blue-500">3</span>
              </div>
              <p className="text-xs font-medium text-foreground">Automatizacion activada</p>
              <p className="text-[10px] text-muted-foreground">GHL envia mensajes automaticamente</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Method 1: Webhook (Enhanced) */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Webhook className="h-4 w-4 text-emerald-500" />
              Metodo 1: Webhook de Workflow
              <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                Recomendado
              </Badge>
            </CardTitle>
            <TestStatusBadge status={webhookTestStatus} />
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Crea un Workflow en GoHighLevel con trigger de webhook y pega la URL.
          </p>

          {/* Setup steps */}
          <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-secondary/20 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pasos para configurar</h4>
            <div className="flex flex-col gap-2.5">
              <Step number={1}>
                En GoHighLevel, ve a <span className="font-medium text-foreground">{'Automation > Workflows'}</span>
              </Step>
              <Step number={2}>
                Crea un nuevo Workflow con trigger <span className="font-medium text-foreground">Inbound Webhook</span>
              </Step>
              <Step number={3}>
                Copia la <span className="font-medium text-foreground">Webhook URL</span> que GHL genera
              </Step>
              <Step number={4}>
                Agrega acciones: <span className="font-medium text-foreground">WhatsApp, Email, Tag, SMS</span>
              </Step>
              <Step number={5}>
                Pega la <span className="font-medium text-foreground">Webhook URL</span> en el campo de abajo y guarda:
              </Step>
            </div>
          </div>

          {/* Webhook URL editable field */}
          <div className="flex flex-col gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
                <LinkIcon className="h-3.5 w-3.5" />
                Webhook URL de GoHighLevel
              </Label>
              {isWebhookConfigured && urlSaveStatus === "idle" && !hasUnsavedUrl && (
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Configurada
                </Badge>
              )}
              {urlSaveStatus === "saved" && (
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                  <Check className="mr-1 h-3 w-3" /> Guardada
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={webhookUrl}
                onChange={(e) => { setWebhookUrl(e.target.value); setUrlSaveStatus("idle"); setUrlError("") }}
                placeholder="https://services.leadconnectorhq.com/hooks/..."
                className="h-10 flex-1 border-border/50 bg-card text-xs font-mono"
              />
              <button
                onClick={saveWebhookUrl}
                disabled={savingUrl || !webhookUrl.trim() || !hasUnsavedUrl}
                className="flex h-10 items-center gap-1.5 rounded-lg bg-emerald-600 px-4 text-xs font-semibold text-white transition-all hover:bg-emerald-500 disabled:opacity-50"
              >
                {savingUrl ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Save className="h-3.5 w-3.5" />
                )}
                Guardar
              </button>
            </div>
            {urlError && (
              <p className="text-xs text-destructive">{urlError}</p>
            )}
            {!isWebhookConfigured && urlSaveStatus === "idle" && (
              <p className="text-xs text-amber-400">Pega la URL del webhook de tu Workflow de GoHighLevel para activar la conexion.</p>
            )}
          </div>

          {/* Webhook Config Fields */}
          <div className="flex flex-col gap-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4">
            <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              <Webhook className="h-3.5 w-3.5" />
              Configuracion del Webhook
            </h4>

            {/* Default Tags */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Default Tags</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {defaultTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs"
                  >
                    {tag}
                    <button onClick={() => removeTag(tag)} className="ml-1.5 hover:text-foreground">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <div className="flex items-center gap-1">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag() } }}
                    placeholder="Agregar tag..."
                    className="h-7 w-28 border-border/50 bg-card text-xs"
                  />
                  <button
                    onClick={addTag}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Evento de prueba + Funnel Step de prueba */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Evento de prueba</Label>
                <Select value={eventName} onValueChange={setEventName}>
                  <SelectTrigger className="h-8 border-border/50 bg-card text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENTS.map((evt) => (
                      <SelectItem key={evt.value} value={evt.value} className="text-xs">
                        {evt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Funnel Step de prueba</Label>
                <Select value={funnelStep} onValueChange={setFunnelStep}>
                  <SelectTrigger className="h-8 border-border/50 bg-card text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNNEL_STEPS.map((step) => (
                      <SelectItem key={step.value} value={step.value} className="text-xs">
                        {step.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Source + Country Code */}
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Source</Label>
                <Input
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="h-8 border-border/50 bg-card text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Phone Default Country Code</Label>
                <Input
                  value={phoneCountryCode}
                  onChange={(e) => setPhoneCountryCode(e.target.value)}
                  placeholder="+57"
                  className="h-8 border-border/50 bg-card text-xs"
                />
              </div>
            </div>

            {/* Auto-tags preview */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Tags resultantes (auto + custom)</Label>
              <div className="flex flex-wrap items-center gap-1.5">
                {computedTags.map((tag) => {
                  const isSystem = (SYSTEM_TAGS as readonly string[]).includes(tag)
                  const isEventTag = EVENTS.some((e) => e.autoTag === tag)
                  return (
                    <Badge
                      key={tag}
                      variant="outline"
                      className={`text-[10px] ${
                        isSystem
                          ? "border-blue-500/30 bg-blue-500/10 text-blue-400"
                          : isEventTag
                            ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                            : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                      }`}
                    >
                      {tag}
                      {isSystem && <span className="ml-1 opacity-50">sistema</span>}
                      {isEventTag && <span className="ml-1 opacity-50">evento</span>}
                    </Badge>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Payload Preview (JSON exacto) */}
          <div className="flex flex-col gap-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center justify-between">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary">
                Payload Preview
              </h4>
              <button
                onClick={() => copyToClipboard(JSON.stringify(previewPayload, null, 2), "preview_payload")}
                className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
              >
                {copiedField === "preview_payload" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                Copiar
              </button>
            </div>
            <pre className="max-h-64 overflow-auto rounded-lg bg-card p-3 text-[11px] leading-relaxed text-foreground">
              {JSON.stringify(previewPayload, null, 2)}
            </pre>
            <div className="flex flex-col gap-1 border-t border-border/50 pt-2">
              <h5 className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Headers adicionales</h5>
              <div className="grid gap-1 text-xs">
                <DataField label="X-MagicFunnel-Source" desc={source} />
                <DataField label="X-MagicFunnel-Event" desc={eventName} />
              </div>
            </div>
          </div>

          {/* Test Button */}
          <button
            onClick={testWebhook}
            disabled={webhookTestStatus === "testing" || !isWebhookConfigured}
            className="flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-emerald-500 disabled:opacity-50"
          >
            {webhookTestStatus === "testing" ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Probando conexion...</>
            ) : (
              <><Send className="h-4 w-4" /> Enviar lead de prueba al webhook</>
            )}
          </button>

          {/* Status messages */}
          {!isWebhookConfigured && webhookTestStatus === "idle" && (
            <p className="text-xs text-amber-400">Guarda una Webhook URL para poder enviar un lead de prueba.</p>
          )}
          {webhookTestStatus === "error" && !debugInfo?.httpCode && (
            <p className="text-xs text-amber-400">No hay Webhook URL configurada. Pega la URL arriba y guarda.</p>
          )}
          {webhookTestStatus === "success" && (
            <p className="text-xs text-emerald-400">Conexion exitosa. Revisa tu Workflow en GoHighLevel.</p>
          )}

          {/* Debug Panel */}
          {debugInfo && (
            <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card p-4">
              <button
                onClick={() => setDebugExpanded(!debugExpanded)}
                className="flex items-center justify-between text-left"
              >
                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Bug className="h-3.5 w-3.5" />
                  Debug del ultimo envio
                </h4>
                {debugExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {debugExpanded && (
                <div className="flex flex-col gap-3">
                  {/* Status row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Estado:</span>
                      {debugInfo.status === "success" ? (
                        <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                          <CheckCircle2 className="mr-1 h-3 w-3" /> Success
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive text-[10px]">
                          <XCircle className="mr-1 h-3 w-3" /> Error
                        </Badge>
                      )}
                    </div>
                    {debugInfo.httpCode && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">HTTP:</span>
                        <code className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${debugInfo.httpCode >= 200 && debugInfo.httpCode < 300 ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                          {debugInfo.httpCode}
                        </code>
                      </div>
                    )}
                    {debugInfo.responseTime && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{debugInfo.responseTime}</span>
                      </div>
                    )}
                  </div>

                  {/* Error message */}
                  {debugInfo.error && (
                    <div className="rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                      {debugInfo.error}
                    </div>
                  )}

                  {/* Response body */}
                  {debugInfo.responseBody && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Response body</span>
                      <pre className="max-h-32 overflow-auto rounded-lg bg-secondary/50 p-3 text-[11px] leading-relaxed text-foreground">
                        {debugInfo.responseBody}
                      </pre>
                    </div>
                  )}

                  {/* Payload sent */}
                  {debugInfo.payloadSent && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payload enviado</span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(debugInfo.payloadSent, null, 2), "debug_payload")}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === "debug_payload" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          Copiar
                        </button>
                      </div>
                      <pre className="max-h-48 overflow-auto rounded-lg bg-secondary/50 p-3 text-[11px] leading-relaxed text-foreground">
                        {JSON.stringify(debugInfo.payloadSent, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Headers sent */}
                  {debugInfo.headersSent && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Headers enviados</span>
                      <pre className="rounded-lg bg-secondary/50 p-3 text-[11px] leading-relaxed text-foreground">
                        {JSON.stringify(debugInfo.headersSent, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Method 2: API v2 (Direct) */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Key className="h-4 w-4 text-blue-500" />
              Metodo 2: API v2 (Contactos directo)
              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/10 text-blue-400 text-[10px]">
                Avanzado
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-2">
              {/* Connection indicator */}
              <div className="flex items-center gap-1.5">
                <span className={`inline-block h-2 w-2 rounded-full ${apiConnected ? "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" : "bg-muted-foreground/40"}`} />
                <span className={`text-[10px] font-medium ${apiConnected ? "text-emerald-400" : "text-muted-foreground"}`}>
                  {apiConnected ? "Conectado" : "No conectado"}
                </span>
              </div>
              <TestStatusBadge status={apiTestStatus} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-sm text-muted-foreground">
            Crea contactos directamente en GHL via API v2 con logica de upsert (crea o actualiza).
          </p>

          {/* Setup steps */}
          <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-secondary/20 p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pasos para configurar</h4>
            <div className="flex flex-col gap-2.5">
              <Step number={1}>
                En GHL, ve a <span className="font-medium text-foreground">{'Settings > Business Profile'}</span> y copia tu <span className="font-medium text-foreground">Location ID</span>
              </Step>
              <Step number={2}>
                Ve a{" "}
                <a href="https://marketplace.gohighlevel.com" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-blue-400 underline">
                  marketplace.gohighlevel.com <ExternalLink className="h-2.5 w-2.5" />
                </a>{" "}
                y genera un <span className="font-medium text-foreground">API Key</span>
              </Step>
              <Step number={3}>
                Pega tus credenciales en los campos de abajo y guarda
              </Step>
            </div>
          </div>

          {/* Credentials fields */}
          <div className="flex flex-col gap-4 rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-400">
                <Key className="h-3.5 w-3.5" />
                Credenciales de API
              </Label>
              {apiSaveStatus === "saved" && (
                <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-[10px]">
                  <Check className="mr-1 h-3 w-3" /> Guardadas
                </Badge>
              )}
            </div>

            {/* API Key */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                GHL API Key
                {apiKeySet && (
                  <span className="ml-2 text-emerald-400">
                    (guardada: {apiKeyMasked})
                  </span>
                )}
              </Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => { setApiKey(e.target.value); setApiSaveStatus("idle"); setApiSaveError("") }}
                placeholder={apiKeySet ? "Dejar vacio para mantener la actual" : "eyJhbGciOiJSUz..."}
                className="h-10 border-border/50 bg-card text-xs font-mono"
              />
            </div>

            {/* Location ID */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs text-muted-foreground">
                GHL Location ID
                {locationIdSet && (
                  <span className="ml-2 text-emerald-400">
                    (guardado: {locationId})
                  </span>
                )}
              </Label>
              <Input
                value={locationId}
                onChange={(e) => { setLocationId(e.target.value); setApiSaveStatus("idle"); setApiSaveError("") }}
                placeholder="abc123..."
                className="h-10 border-border/50 bg-card text-xs font-mono"
              />
            </div>

            {apiSaveError && (
              <p className="text-xs text-destructive">{apiSaveError}</p>
            )}

            <button
              onClick={saveApiCredentials}
              disabled={savingApi || (!apiKey.trim() && !locationId.trim())}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
            >
              {savingApi ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...</>
              ) : (
                <><Save className="h-3.5 w-3.5" /> Conectar con GoHighLevel</>
              )}
            </button>
          </div>

          {/* Test button */}
          <button
            onClick={testApi}
            disabled={apiTestStatus === "testing" || !apiConnected}
            className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-blue-500 disabled:opacity-50"
          >
            {apiTestStatus === "testing" ? (
              <><RefreshCw className="h-4 w-4 animate-spin" /> Probando API...</>
            ) : (
              <><Send className="h-4 w-4" /> Enviar lead de prueba</>
            )}
          </button>

          {/* Status messages */}
          {!apiConnected && apiTestStatus === "idle" && (
            <p className="text-xs text-amber-400">Guarda tus credenciales para poder enviar un lead de prueba.</p>
          )}
          {apiTestStatus === "success" && (
            <p className="text-xs text-emerald-400">Contacto procesado en GoHighLevel correctamente.</p>
          )}
          {apiTestStatus === "error" && !apiLog?.httpCode && (
            <p className="text-xs text-amber-400">Error de conexion. Verifica tus credenciales.</p>
          )}

          {/* API Log Panel */}
          {apiLog && (
            <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-card p-4">
              <button
                onClick={() => setApiLogExpanded(!apiLogExpanded)}
                className="flex items-center justify-between text-left"
              >
                <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Bug className="h-3.5 w-3.5" />
                  Log del ultimo envio
                </h4>
                {apiLogExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>
              {apiLogExpanded && (
                <div className="flex flex-col gap-3">
                  {/* Status row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground">Estado:</span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          apiLog.status === "success"
                            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                            : apiLog.status === "rejected"
                              ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                              : "border-destructive/30 bg-destructive/10 text-destructive"
                        }`}
                      >
                        {apiLog.status === "success" && <CheckCircle2 className="mr-1 h-3 w-3" />}
                        {apiLog.status === "rejected" && <XCircle className="mr-1 h-3 w-3" />}
                        {apiLog.status === "error" && <XCircle className="mr-1 h-3 w-3" />}
                        {apiLog.status}
                      </Badge>
                    </div>
                    {apiLog.action && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Accion:</span>
                        <code className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-400">{apiLog.action}</code>
                      </div>
                    )}
                    {apiLog.httpCode && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">HTTP:</span>
                        <code className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${apiLog.httpCode >= 200 && apiLog.httpCode < 300 ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                          {apiLog.httpCode}
                        </code>
                      </div>
                    )}
                    {apiLog.elapsed && (
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{apiLog.elapsed}</span>
                      </div>
                    )}
                    {apiLog.contactId && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Contact ID:</span>
                        <code className="rounded bg-card px-1.5 py-0.5 text-[10px] font-mono text-foreground">{apiLog.contactId}</code>
                      </div>
                    )}
                  </div>

                  {/* Message */}
                  <div className={`rounded-lg p-3 text-xs ${
                    apiLog.status === "success"
                      ? "bg-emerald-500/10 text-emerald-400"
                      : apiLog.status === "rejected"
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-destructive/10 text-destructive"
                  }`}>
                    {apiLog.message}
                  </div>

                  {/* Payload sent */}
                  {apiLog.payloadSent && (
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Payload enviado</span>
                        <button
                          onClick={() => copyToClipboard(JSON.stringify(apiLog.payloadSent, null, 2), "api_debug_payload")}
                          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                        >
                          {copiedField === "api_debug_payload" ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          Copiar
                        </button>
                      </div>
                      <pre className="max-h-48 overflow-auto rounded-lg bg-secondary/50 p-3 text-[11px] leading-relaxed text-foreground">
                        {JSON.stringify(apiLog.payloadSent, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Response body */}
                  {apiLog.responseBody && (
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Response body</span>
                      <pre className="max-h-32 overflow-auto rounded-lg bg-secondary/50 p-3 text-[11px] leading-relaxed text-foreground">
                        {apiLog.responseBody}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Execution Logs */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-sm">
              <History className="h-4 w-4 text-primary" />
              Registros de ejecucion
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-3 text-[10px]">
                <span className="text-emerald-400">{execStats.success} OK</span>
                <span className="text-destructive">{execStats.errors} Error</span>
                <span className="text-amber-400">{execStats.rejected} Rechazado</span>
              </div>
              <button
                onClick={loadLogs}
                disabled={logsLoading}
                className="flex h-7 w-7 items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <RefreshCw className={`h-3 w-3 ${logsLoading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {execLogs.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-xs text-muted-foreground">No hay registros de ejecucion todavia.</p>
              <p className="text-[10px] text-muted-foreground/60">Los registros apareceran cuando un lead complete un embudo con GHL activo.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-0">
              {/* Header */}
              <div className="grid grid-cols-[1fr_80px_80px_60px_60px_50px] items-center gap-2 border-b border-border/50 pb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Lead / Embudo</span>
                <span>Metodo</span>
                <span>Accion</span>
                <span>HTTP</span>
                <span>Tiempo</span>
                <span></span>
              </div>
              {/* Rows */}
              {execLogs.map((log) => (
                <div
                  key={log.id}
                  className="grid grid-cols-[1fr_80px_80px_60px_60px_50px] items-center gap-2 border-b border-border/30 py-2.5 text-xs last:border-0"
                >
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="truncate font-medium text-foreground">{log.leadNombre || log.leadEmail}</span>
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className="border-border/30 text-[9px] text-muted-foreground">{log.embudoNombre || log.embudoId}</Badge>
                      <span className="text-[9px] text-muted-foreground/50">{log.tag}</span>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={`w-fit text-[9px] ${log.method === "api" ? "border-blue-500/30 text-blue-400" : "border-emerald-500/30 text-emerald-400"}`}
                  >
                    {log.method === "api" ? "API v2" : "Webhook"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className={`w-fit text-[9px] ${
                      log.status === "success"
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                        : log.status === "rejected"
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                          : "border-destructive/30 bg-destructive/10 text-destructive"
                    }`}
                  >
                    {log.action}
                  </Badge>
                  <code className={`text-[10px] ${
                    log.httpCode && log.httpCode >= 200 && log.httpCode < 300
                      ? "text-emerald-400" : log.httpCode ? "text-destructive" : "text-muted-foreground"
                  }`}>
                    {log.httpCode || "-"}
                  </code>
                  <span className="text-[10px] text-muted-foreground">{log.elapsed}</span>
                  <div>
                    {log.status === "error" && (
                      <button
                        onClick={() => retryLog(log.id)}
                        disabled={retryingId === log.id}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-border/50 text-muted-foreground hover:bg-secondary hover:text-foreground disabled:opacity-50"
                        title="Reintentar"
                      >
                        {retryingId === log.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex w-full items-center justify-between"
          >
            <CardTitle className="flex items-center gap-2 text-sm">
              <Settings className="h-4 w-4 text-muted-foreground" />
              Configuracion avanzada
            </CardTitle>
            {showAdvanced ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </button>
        </CardHeader>
        {showAdvanced && (
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Base URL</Label>
                <Input
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  className="h-8 border-border/50 bg-card text-xs font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">API Version</Label>
                <Input
                  value={apiVersion}
                  onChange={(e) => setApiVersion(e.target.value)}
                  className="h-8 border-border/50 bg-card text-xs font-mono"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Default Source</Label>
                <Input
                  value={defaultSource}
                  onChange={(e) => setDefaultSource(e.target.value)}
                  className="h-8 border-border/50 bg-card text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Timeout (ms)</Label>
                <Input
                  type="number"
                  value={timeoutMs}
                  onChange={(e) => setTimeoutMs(Number(e.target.value))}
                  className="h-8 border-border/50 bg-card text-xs"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs text-muted-foreground">Reintentos</Label>
                <Input
                  type="number"
                  value={retryCount}
                  onChange={(e) => setRetryCount(Number(e.target.value))}
                  min={0}
                  max={5}
                  className="h-8 border-border/50 bg-card text-xs"
                />
              </div>
            </div>
            <button
              onClick={saveAdvancedConfig}
              className="flex w-fit items-center gap-1.5 rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-foreground transition-colors hover:bg-secondary/80"
            >
              <Save className="h-3.5 w-3.5" /> Guardar configuracion avanzada
            </button>
          </CardContent>
        )}
      </Card>

      {/* Automation ideas */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <MessageSquare className="h-4 w-4 text-primary" />
            Ideas de automatizacion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <AutomationCard icon={<MessageSquare className="h-4 w-4 text-emerald-500" />} title="WhatsApp inmediato" desc="Mensaje de bienvenida automatico al lead" tag="Trigger" />
            <AutomationCard icon={<Mail className="h-4 w-4 text-blue-500" />} title="Secuencia de emails" desc="5 emails educativos durante 7 dias" tag="Nurturing" />
            <AutomationCard icon={<MessageSquare className="h-4 w-4 text-emerald-500" />} title="Follow-up 24h" desc="Recordatorio por WhatsApp si no abrio email" tag="Reactivacion" />
            <AutomationCard icon={<Building2 className="h-4 w-4 text-amber-500" />} title="Asignar vendedor" desc="Leads calientes a un asesor automaticamente" tag="Pipeline" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function TestStatusBadge({ status }: { status: TestStatus }) {
  if (status === "idle") return null
  if (status === "testing") {
    return (
      <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">
        <RefreshCw className="mr-1 h-3 w-3 animate-spin" /> Probando
      </Badge>
    )
  }
  if (status === "success") {
    return (
      <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
        <CheckCircle2 className="mr-1 h-3 w-3" /> Conectado
      </Badge>
    )
  }
  return (
    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-400">
      <XCircle className="mr-1 h-3 w-3" /> Sin configurar
    </Badge>
  )
}

function Step({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-card text-[10px] font-bold text-muted-foreground">{number}</span>
      <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
    </div>
  )
}

function DataField({ label, desc }: { label: string; desc: string }) {
  return (
    <div className="flex items-center gap-2">
      <code className="shrink-0 rounded bg-card px-1.5 py-0.5 text-[10px] font-medium text-primary">{label}</code>
      <span className="text-muted-foreground">{desc}</span>
    </div>
  )
}

function AutomationCard({ icon, title, desc, tag }: { icon: React.ReactNode; title: string; desc: string; tag: string }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border/50 bg-secondary/20 p-3">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium text-foreground">{title}</span>
      </div>
      <p className="text-[10px] leading-relaxed text-muted-foreground">{desc}</p>
      <Badge variant="outline" className="w-fit border-border/50 text-[10px] text-muted-foreground">{tag}</Badge>
    </div>
  )
}
