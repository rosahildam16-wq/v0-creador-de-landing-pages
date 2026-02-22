"use client"

import { SubscriptionPanel } from "@/components/shared/subscription-panel"
import { CreditCard } from "lucide-react"

export default function AdminSubscriptionPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
          <CreditCard className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mi Suscripcion</h1>
          <p className="text-sm text-muted-foreground">Gestiona tu plan y pagos</p>
        </div>
      </div>

      <SubscriptionPanel />
    </div>
  )
}
