// Subscription & Payment types for NOWPayments USDT integration

export type SubscriptionStatus = "trial" | "active" | "pending_payment" | "expired" | "cancelled"

export type PaymentStatus =
  | "waiting"
  | "confirming"
  | "confirmed"
  | "sending"
  | "finished"
  | "failed"
  | "expired"
  | "partially_paid"
  | "refunded"

export interface SubscriptionPlan {
  id: string
  nombre: string
  precio_usdt: number
  periodo: string
  max_leads: number | null
  max_embudos: number | null
  max_miembros: number | null
  features: string[]
  activo: boolean
  created_at: string
}

export interface Subscription {
  id: string
  user_email: string
  user_role: "super_admin" | "leader" | "member"
  plan_id: string
  status: SubscriptionStatus
  trial_starts_at: string | null
  trial_ends_at: string | null
  current_period_start: string | null
  current_period_end: string | null
  paid_by: string | null
  nowpayments_payment_id: string | null
  created_at: string
  updated_at: string
  // Joined fields
  plan?: SubscriptionPlan
}

export interface Payment {
  id: string
  subscription_id: string
  nowpayments_payment_id: string | null
  nowpayments_invoice_id: string | null
  nowpayments_order_id: string | null
  amount_usdt: number
  status: PaymentStatus
  pay_address: string | null
  network: string | null
  created_at: string
  updated_at: string
}

// NOWPayments API types
export interface NowPaymentsInvoice {
  id: string
  token_id: string
  order_id: string
  order_description: string
  price_amount: number
  price_currency: string
  pay_currency: string | null
  ipn_callback_url: string
  invoice_url: string
  success_url: string
  cancel_url: string
  created_at: string
  updated_at: string
}

export interface NowPaymentsIPNPayload {
  payment_id: number
  invoice_id: number | null
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id: string
  order_description: string
  outcome_amount: number
  outcome_currency: string
  created_at: string
  updated_at: string
  actually_paid: number
  actually_paid_at_fiat: number
  purchase_id: string
  network?: string
}

export const PLAN_TIERS = {
  basico: {
    color: "from-blue-500 to-cyan-400",
    badge: "Ideal para empezar",
    popular: false,
  },
  pro: {
    color: "from-primary to-accent",
    badge: "Mas popular",
    popular: true,
  },
  elite: {
    color: "from-amber-500 to-orange-400",
    badge: "Para lideres serios",
    popular: false,
  },
} as const
