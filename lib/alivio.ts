/**
 * Alivio Payment Gateway - API Client
 * https://aliviopayment.com
 */

const ALIVIO_API_BASE = "https://aliviopayment.com/api"

interface AlivioPaymentRequest {
    amount: number
    currency?: string
    orderId: string
    customerEmail: string
    metadata?: Record<string, any>
}

interface AlivioPaymentResponse {
    success: boolean
    message: string
    data: {
        payment: {
            id: string
            amount: number
            currency: string
            status: string
            orderId: string
            customerEmail: string
            paymentUrl?: string
            expiresAt?: string
            [key: string]: any
        }
    }
}

function getApiKey(): string {
    const key = process.env.ALIVIO_API_KEY
    if (!key) throw new Error("ALIVIO_API_KEY is not configured")
    return key
}

/**
 * Create a new payment
 */
export async function createAlivioPayment(
    params: AlivioPaymentRequest
): Promise<AlivioPaymentResponse> {
    const res = await fetch(`${ALIVIO_API_BASE}/payments/create`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": getApiKey(),
        },
        body: JSON.stringify({
            amount: params.amount,
            currency: params.currency || "USD",
            orderId: params.orderId,
            customerEmail: params.customerEmail,
            metadata: params.metadata || {},
        }),
    })

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(
            `Alivio API error (${res.status}): ${errorData.message || res.statusText}`
        )
    }

    return res.json()
}

/**
 * Get payment status
 */
export async function getAlivioPaymentStatus(paymentId: string) {
    const res = await fetch(`${ALIVIO_API_BASE}/payments/${paymentId}`, {
        method: "GET",
        headers: {
            "x-api-key": getApiKey(),
        },
    })

    if (!res.ok) {
        throw new Error(`Alivio status error: ${res.status}`)
    }

    return res.json()
}

/**
 * Verify webhook signature
 */
export function verifyAlivioWebhook(
    payload: string,
    signature: string
): boolean {
    const secret = process.env.ALIVIO_WEBHOOK_SECRET
    if (!secret) {
        console.warn("ALIVIO_WEBHOOK_SECRET not set, skipping verification")
        return true
    }

    try {
        const crypto = require("crypto")
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(payload)
            .digest("hex")
        return signature === expectedSignature
    } catch {
        return false
    }
}

/**
 * Plan configuration
 */
export const ALIVIO_PLANS: Record<
    string,
    { name: string; amount: number; period: string }
> = {
    basico: { name: "Plan Básico", amount: 27, period: "mensual" },
    pro: { name: "Plan Pro", amount: 47, period: "mensual" },
    elite: { name: "Plan Elite", amount: 97, period: "mensual" },
}
