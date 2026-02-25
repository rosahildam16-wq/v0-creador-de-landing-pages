"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { IntegrationCard, type IntegrationStatus } from "@/components/admin/integration-card"
import { IntegrationWhatsApp } from "@/components/admin/integration-whatsapp"
import { IntegrationGoogleCalendar } from "@/components/admin/integration-google-calendar"
import { IntegrationZoom } from "@/components/admin/integration-zoom"
import { IntegrationGHL } from "@/components/admin/integration-ghl"
import {
  MessageSquare,
  Calendar,
  Video,
  Building2,
  Plug,
} from "lucide-react"

type IntegrationId = "whatsapp" | "google-calendar" | "zoom" | "ghl"

interface Integration {
  id: IntegrationId
  name: string
  description: string
  icon: React.ReactNode
  status: IntegrationStatus
  accentColor: string
}

export default function IntegracionesPage() {
  const [selectedId, setSelectedId] = useState<IntegrationId>("whatsapp")
  const [statuses, setStatuses] = useState<Record<IntegrationId, IntegrationStatus>>({
    whatsapp: "disconnected",
    "google-calendar": "disconnected",
    zoom: "disconnected",
    ghl: "disconnected",
  })

  // Check real connection status for each integration
  useEffect(() => {
    async function checkStatuses() {
      // Check Google
      try {
        const gRes = await fetch("/api/integrations/google?action=status")
        const gData = await gRes.json()
        if (gData.connected) {
          setStatuses((prev) => ({ ...prev, "google-calendar": "connected" }))
        }
      } catch {
        // Not connected
      }

      // Check Zoom
      try {
        const zRes = await fetch("/api/integrations/zoom?action=status")
        const zData = await zRes.json()
        if (zData.connected) {
          setStatuses((prev) => ({ ...prev, zoom: "connected" }))
        }
      } catch {
        // Not connected
      }

      // Check WhatsApp
      try {
        const wRes = await fetch("/api/integrations/whatsapp?action=status")
        const wData = await wRes.json()
        if (wData.connected) {
          setStatuses((prev) => ({ ...prev, whatsapp: "connected" }))
        }
      } catch {
        // Not connected
      }
    }

    checkStatuses()
  }, [])

  const integrations: Integration[] = [
    {
      id: "whatsapp",
      name: "WhatsApp",
      description: "Conecta escaneando QR, sin API",
      icon: <MessageSquare className="h-5 w-5 text-emerald-500" />,
      status: statuses.whatsapp,
      accentColor: "#22c55e",
    },
    {
      id: "google-calendar",
      name: "Google Calendar",
      description: "Un clic para sincronizar tu calendario",
      icon: <Calendar className="h-5 w-5 text-blue-500" />,
      status: statuses["google-calendar"],
      accentColor: "#3b82f6",
    },
    {
      id: "zoom",
      name: "Zoom",
      description: "Un clic para crear reuniones",
      icon: <Video className="h-5 w-5 text-[#2D8CFF]" />,
      status: statuses.zoom,
      accentColor: "#2D8CFF",
    },
    {
      id: "ghl",
      name: "GoHighLevel",
      description: "CRM y automatizaciones avanzadas",
      icon: <Building2 className="h-5 w-5 text-primary" />,
      status: statuses.ghl,
      accentColor: "hsl(0, 72%, 51%)",
    },
  ]

  const connectedCount = Object.values(statuses).filter((s) => s === "connected").length

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight">Integraciones</h1>
          <Badge variant="outline" className="border-primary/30 bg-primary/10 text-primary">
            {connectedCount}/{integrations.length} conectadas
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Conecta tus herramientas favoritas para automatizar tu flujo de trabajo
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-card p-4">
        <Plug className="h-5 w-5 text-muted-foreground" />
        <p className="flex-1 text-sm text-muted-foreground">
          Selecciona una integracion para configurarla. Los workflows usaran estas conexiones para enviar mensajes y crear reuniones automaticamente.
        </p>
      </div>

      {/* Layout: sidebar + detail */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Sidebar - integration list */}
        <div className="flex w-full shrink-0 flex-col gap-2 lg:w-72">
          {integrations.map((integration) => (
            <IntegrationCard
              key={integration.id}
              name={integration.name}
              description={integration.description}
              icon={integration.icon}
              status={integration.status}
              accentColor={integration.accentColor}
              isSelected={selectedId === integration.id}
              onClick={() => setSelectedId(integration.id)}
            />
          ))}
        </div>

        {/* Detail panel */}
        <div className="min-w-0 flex-1">
          {selectedId === "whatsapp" && <IntegrationWhatsApp />}
          {selectedId === "google-calendar" && <IntegrationGoogleCalendar />}
          {selectedId === "zoom" && <IntegrationZoom />}
          {selectedId === "ghl" && <IntegrationGHL />}
        </div>
      </div>
    </div>
  )
}
