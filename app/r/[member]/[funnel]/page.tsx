"use client"

import { Suspense } from "react"
import { FunnelController } from "@/components/funnel-controller"
import { MetaPixel } from "@/components/shared/meta-pixel"

function ReferralFunnel({ memberSlug, funnelId }: { memberSlug: string; funnelId: string }) {
  // Store referrer info in sessionStorage so leads get attributed
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("mf_referrer", memberSlug)
      sessionStorage.setItem("mf_referrer_funnel", funnelId)
    } catch { /* noop */ }
  }

  return (
    <>
      <MetaPixel embudoId={funnelId} memberId={memberSlug} />
      <FunnelController embudoId={funnelId} referrer={memberSlug} />
    </>
  )
}

export default function ReferralPage({ params }: { params: { member: string; funnel: string } }) {
  const { member, funnel } = params

  return (
    <Suspense>
      <ReferralFunnel memberSlug={member} funnelId={funnel} />
    </Suspense>
  )
}
