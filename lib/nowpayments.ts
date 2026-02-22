import crypto from "crypto"

const API_BASE = "https://api.nowpayments.io/v1"

function getApiKey(): string {
  const key = process.env.NOWPAYMENTS_API_KEY
  if (!key) {
    throw new Error(
      "NOWPAYMENTS_API_KEY no esta configurada. Agrega esta variable de entorno en el panel de Vercel."
    )
  }
  return key
}

function getIpnSecret(): string {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET
  if (!secret) {
    throw new Error(
      "NOWPAYMENTS_IPN_SECRET no esta configurada. Agrega esta variable de entorno en el panel de Vercel."
    )
  }
  return secret
}

/**
 * Creates an invoice on NOWPayments for a USDT payment.
 */
export async function createInvoice(params: {
  priceAmount: number
  orderId: string
  orderDescription: string
  successUrl: string
  cancelUrl: string
  ipnCallbackUrl: string
}) {
  const res = await fetch(`${API_BASE}/invoice`, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      price_amount: params.priceAmount,
      price_currency: "usd",
      pay_currency: "usdttrc20",
      order_id: params.orderId,
      order_description: params.orderDescription,
      ipn_callback_url: params.ipnCallbackUrl,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      is_fixed_rate: true,
      is_fee_paid_by_user: false,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`NOWPayments createInvoice error: ${res.status} - ${error}`)
  }

  return res.json()
}

/**
 * Verifies an IPN (Instant Payment Notification) callback signature
 * from NOWPayments using HMAC-SHA512.
 */
export function verifyIPN(payload: Record<string, unknown>, signature: string): boolean {
  const secret = getIpnSecret()

  // Sort payload keys alphabetically and create a JSON string
  const sortedKeys = Object.keys(payload).sort()
  const sortedPayload: Record<string, unknown> = {}
  for (const key of sortedKeys) {
    sortedPayload[key] = payload[key]
  }

  const hmac = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(sortedPayload))
    .digest("hex")

  return hmac === signature
}

/**
 * Gets payment status from NOWPayments API.
 */
export async function getPaymentStatus(paymentId: string) {
  const res = await fetch(`${API_BASE}/payment/${paymentId}`, {
    headers: { "x-api-key": getApiKey() },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`NOWPayments getPaymentStatus error: ${res.status} - ${error}`)
  }

  return res.json()
}

/**
 * Check if NOWPayments API is available and configured.
 */
export async function checkApiStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/status`, {
      headers: { "x-api-key": getApiKey() },
    })
    const data = await res.json()
    return data?.message === "OK"
  } catch {
    return false
  }
}
