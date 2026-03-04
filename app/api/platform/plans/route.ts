import { NextResponse } from "next/server"
import { getPlatformPlans } from "@/lib/server/platform-plans"

export const dynamic = "force-dynamic"

/**
 * GET /api/platform/plans
 * Returns all active platform plans (public — used on pricing pages).
 */
export async function GET() {
  const plans = await getPlatformPlans()
  return NextResponse.json({ plans })
}
