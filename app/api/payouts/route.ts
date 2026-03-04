import { NextRequest, NextResponse } from "next/server"
import { decrypt } from "@/lib/auth/session"
import {
  getUserPayouts,
  queuePayout,
  getPendingPayoutTotal,
  getTotalPaidOut,
  MIN_PAYOUT_AMOUNT,
} from "@/lib/server/payouts"
import { getPayableCommissions } from "@/lib/server/commissions"

export const dynamic = "force-dynamic"

async function getSessionUser(request: NextRequest) {
  try {
    const token = request.cookies.get("mf_session")?.value
    if (!token) return null
    const session = await decrypt(token)
    return session?.user ?? null
  } catch {
    return null
  }
}

/**
 * GET /api/payouts
 * Returns payout history and balance summary for the authenticated user.
 */
export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user?.memberId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const userId = user.memberId as string

  const [payouts, pendingTotal, totalPaid, payableCommissions] = await Promise.all([
    getUserPayouts(userId),
    getPendingPayoutTotal(userId),
    getTotalPaidOut(userId),
    getPayableCommissions(userId),
  ])

  const payableBalance = payableCommissions.reduce(
    (sum, c) => {
      if (c.sponsor_level1_user_id === userId) sum += c.level1_amount
      if (c.sponsor_level2_user_id === userId) sum += c.level2_amount
      return sum
    },
    0
  )

  return NextResponse.json({
    payouts,
    summary: {
      payableBalance: parseFloat(payableBalance.toFixed(2)),
      pendingPayoutTotal: parseFloat(pendingTotal.toFixed(2)),
      lifetimePaid: parseFloat(totalPaid.toFixed(2)),
      minimumPayout: MIN_PAYOUT_AMOUNT,
    },
  })
}

/**
 * POST /api/payouts
 * Queues a payout request for the authenticated user.
 * Minimum $50 enforced. Amount must not exceed available payable balance.
 *
 * Body: { amount, currency? }
 */
export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user?.memberId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const userId = user.memberId as string

  let body: { amount?: number; currency?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Cuerpo JSON inválido" }, { status: 400 })
  }

  if (!body.amount || typeof body.amount !== "number") {
    return NextResponse.json({ error: "Se requiere: amount (número)" }, { status: 400 })
  }

  if (body.amount < MIN_PAYOUT_AMOUNT) {
    return NextResponse.json(
      { error: `El monto mínimo de retiro es $${MIN_PAYOUT_AMOUNT}` },
      { status: 422 }
    )
  }

  // Verify the user has enough payable commission balance
  const payableCommissions = await getPayableCommissions(userId)
  const payableBalance = payableCommissions.reduce((sum, c) => {
    if (c.sponsor_level1_user_id === userId) sum += c.level1_amount
    if (c.sponsor_level2_user_id === userId) sum += c.level2_amount
    return sum
  }, 0)

  const alreadyPending = await getPendingPayoutTotal(userId)
  const available = payableBalance - alreadyPending

  if (body.amount > available) {
    return NextResponse.json(
      { error: `Saldo disponible insuficiente. Disponible: $${available.toFixed(2)}` },
      { status: 422 }
    )
  }

  const payout = await queuePayout(userId, body.amount, body.currency ?? "USD")
  if (!payout) {
    return NextResponse.json({ error: "Error al solicitar retiro" }, { status: 500 })
  }

  return NextResponse.json({ payout }, { status: 201 })
}
