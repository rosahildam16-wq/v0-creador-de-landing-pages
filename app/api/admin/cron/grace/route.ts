import { NextRequest, NextResponse } from "next/server"
import { processExpiredGracePeriods } from "@/lib/server/community-plans"

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/cron/grace
 * Freezes all community memberships whose grace_until has passed
 * (status: past_due → frozen).
 *
 * Auth: Bearer token via CRON_SECRET environment variable.
 * Schedule: Run every hour (e.g. Vercel Cron or external scheduler).
 */
export async function POST(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET no configurado" }, { status: 500 })
  }

  const auth = request.headers.get("authorization")
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const count = await processExpiredGracePeriods()
  console.log(`[cron/grace] Froze ${count} membership(s) with expired grace period`)

  return NextResponse.json({ success: true, frozen: count })
}
