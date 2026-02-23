"use client"

import { use } from "react"
import { Suspense } from "react"
import { FunnelController } from "@/components/funnel-controller"

function ReferralFunnel({ memberSlug, funnelId }: { memberSlug: string; funnelId: string }) {
  // Store referrer info in sessionStorage so leads get attributed
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("mf_referrer", memberSlug)
      sessionStorage.setItem("mf_referrer_funnel", funnelId)
    } catch { /* noop */ }
  }

  return <FunnelController embudoId={funnelId} />
}

export default function ReferralPage({ params }: { params: Promise<{ member: string; funnel: string }> }) {
  const { member, funnel } = use(params)

  return (
    <Suspense>
      <ReferralFunnel memberSlug={member} funnelId={funnel} />
    </Suspense>
  )
}
