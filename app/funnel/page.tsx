"use client"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { FunnelController } from "@/components/funnel-controller"
import { MetaPixel } from "@/components/shared/meta-pixel"

function FunnelContent() {
  const searchParams = useSearchParams()
  const embudoId = searchParams.get("embudo") || "nomada-vip"

  return (
    <>
      {/* Meta Pixel auto-loads config per embudo from DB (like Hotmart) */}
      <MetaPixel embudoId={embudoId} />
      <FunnelController embudoId={embudoId} />
    </>
  )
}

export default function FunnelPage() {
  return (
    <Suspense>
      <FunnelContent />
    </Suspense>
  )
}
