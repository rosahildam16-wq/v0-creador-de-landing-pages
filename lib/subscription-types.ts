// Subscription & Payment types — Alivio Payment Gateway integration

export type SubscriptionStatus = "trial" | "active" | "pending_payment" | "expired" | "cancelled"

export type PaymentStatus =
  | "waiting"
  | "confirming"
  | "confirmed"
  | "finished"
  | "failed"
  | "expired"
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
  payment_id: string | null
  payment_method: string | null
  created_at: string
  updated_at: string
  // Joined fields
  plan?: SubscriptionPlan
}

export interface Payment {
  id: string
  subscription_id: string
  provider_payment_id: string | null
  provider_invoice_id: string | null
  provider_order_id: string | null
  provider: string
  amount_usdt: number
  status: PaymentStatus
  raw_data: any
  created_at: string
  updated_at: string
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
