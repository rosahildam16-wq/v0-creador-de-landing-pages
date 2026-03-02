"use client"

import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { FunnelController } from "@/components/funnel-controller"
import { MetaPixel } from "@/components/shared/meta-pixel"

function FunnelContent() {
  const searchParams = useSearchParams()
  const embudoId = searchParams.get("embudo") || "nomada-vip"
  const [pixelId, setPixelId] = useState<string>("")

  useEffect(() => {
    // Load pixel config for this funnel (or global fallback)
    fetch(`/api/pixel/config?embudo_id=${embudoId}`)
      .then(r => r.json())
      .then(data => {
        if (data.pixel_id && data.enabled) {
          setPixelId(data.pixel_id)
        }
      })
      .catch(() => {
        // Check env variable fallback
        const envPixel = process.env.NEXT_PUBLIC_META_PIXEL_ID
        if (envPixel) setPixelId(envPixel)
      })
  }, [embudoId])

  return (
    <>
      <MetaPixel pixelId={pixelId} />
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
