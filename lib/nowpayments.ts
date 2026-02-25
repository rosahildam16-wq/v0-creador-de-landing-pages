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

// ============================================================
// RECURRING PAYMENTS / SUBSCRIPTIONS
// ============================================================

/**
 * Get an auth token for the NowPayments Recurring API.
 * Required for subscription endpoints.
 */
async function getAuthToken(): Promise<string> {
  const email = process.env.NOWPAYMENTS_EMAIL
  const password = process.env.NOWPAYMENTS_PASSWORD
  if (!email || !password) {
    throw new Error(
      "NOWPAYMENTS_EMAIL y NOWPAYMENTS_PASSWORD son necesarias para suscripciones recurrentes."
    )
  }

  const res = await fetch(`${API_BASE}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`NOWPayments auth error: ${res.status} - ${error}`)
  }

  const data = await res.json()
  return data.token
}

/**
 * Create a recurring payment plan on NowPayments.
 * Returns the plan ID from NowPayments.
 */
export async function createRecurringPlan(params: {
  title: string
  intervalDay: number
  amount: number
  currency: string
}): Promise<{ id: string }> {
  const token = await getAuthToken()

  const res = await fetch(`${API_BASE}/subscriptions/plans`, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: params.title,
      interval_day: params.intervalDay,
      amount: params.amount,
      currency: params.currency,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`NOWPayments createRecurringPlan error: ${res.status} - ${error}`)
  }

  return res.json()
}

/**
 * Get a subscription email payment link.
 * NowPayments sends a recurring payment email to the subscriber.
 */
export async function createEmailSubscription(params: {
  planId: string
  email: string
  orderId: string
  ipnCallbackUrl: string
  successUrl: string
  cancelUrl: string
  partiallyPaidUrl?: string
}): Promise<{ id: string; invoice_url: string }> {
  const token = await getAuthToken()

  const res = await fetch(`${API_BASE}/subscriptions`, {
    method: "POST",
    headers: {
      "x-api-key": getApiKey(),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subscription_plan_id: params.planId,
      email: params.email,
      order_id: params.orderId,
      ipn_callback_url: params.ipnCallbackUrl,
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      partially_paid_url: params.partiallyPaidUrl || params.cancelUrl,
    }),
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`NOWPayments createEmailSubscription error: ${res.status} - ${error}`)
  }

  return res.json()
}

/**
 * Get payments for a specific subscription.
 */
export async function getSubscriptionPayments(subscriptionId: string) {
  const token = await getAuthToken()

  const res = await fetch(`${API_BASE}/subscriptions/${subscriptionId}/payments`, {
    headers: {
      "x-api-key": getApiKey(),
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`NOWPayments getSubscriptionPayments error: ${res.status} - ${error}`)
  }

  return res.json()
}

/**
 * Delete/cancel a subscription.
 */
export async function cancelSubscription(subscriptionId: string): Promise<void> {
  const token = await getAuthToken()

  const res = await fetch(`${API_BASE}/subscriptions/${subscriptionId}`, {
    method: "DELETE",
    headers: {
      "x-api-key": getApiKey(),
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    const error = await res.text()
    throw new Error(`NOWPayments cancelSubscription error: ${res.status} - ${error}`)
  }
}
