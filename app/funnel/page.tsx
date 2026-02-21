"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { FunnelController } from "@/components/funnel-controller"

function FunnelContent() {
  const searchParams = useSearchParams()
  const embudoId = searchParams.get("embudo") || "nomada-vip"
  return <FunnelController embudoId={embudoId} />
}

export default function FunnelPage() {
  return (
    <Suspense>
      <FunnelContent />
    </Suspense>
  )
}
