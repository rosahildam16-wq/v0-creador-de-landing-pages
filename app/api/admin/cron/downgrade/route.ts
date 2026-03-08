import { NextRequest, NextResponse } from "next/server"
import { processScheduledDowngrades } from "@/lib/server/platform-plans"

export const dynamic = "force-dynamic"

/**
 * POST /api/admin/cron/downgrade
 * Processes all users whose downgrade_to_student_at is in the past,
 * moving them to the 'student' plan with status 'canceled'.
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

  const count = await processScheduledDowngrades()
  console.log(`[cron/downgrade] Downgraded ${count} user(s) to student plan`)

  return NextResponse.json({ success: true, downgraded: count })
}
