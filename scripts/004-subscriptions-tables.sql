-- ============================================
-- Subscription Plans, Subscriptions & Payments
-- NOWPayments USDT integration
-- ============================================

-- Tabla de planes de suscripcion
CREATE TABLE IF NOT EXISTS subscription_plans (
  id text PRIMARY KEY,
  nombre text NOT NULL,
  precio_usdt numeric(10,2) NOT NULL,
  periodo text DEFAULT 'mensual',
  max_leads integer,
  max_embudos integer,
  max_miembros integer,
  features jsonb DEFAULT '[]'::jsonb,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabla de suscripciones
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email text NOT NULL,
  user_role text NOT NULL CHECK (user_role IN ('admin', 'member')),
  plan_id text REFERENCES subscription_plans(id),
  status text DEFAULT 'trial' CHECK (status IN ('trial', 'active', 'pending_payment', 'expired', 'cancelled')),
  trial_starts_at timestamptz DEFAULT now(),
  trial_ends_at timestamptz,
  current_period_start timestamptz,
  current_period_end timestamptz,
  paid_by text,
  nowpayments_payment_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabla de pagos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  nowpayments_payment_id text UNIQUE,
  nowpayments_invoice_id text,
  nowpayments_order_id text,
  amount_usdt numeric(10,2),
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'confirming', 'confirmed', 'sending', 'finished', 'failed', 'expired', 'partially_paid', 'refunded')),
  pay_address text,
  network text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paid_by ON subscriptions(paid_by);
CREATE INDEX IF NOT EXISTS idx_payments_np_id ON payments(nowpayments_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(nowpayments_invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);

-- Seed: Insertar planes predeterminados
INSERT INTO subscription_plans (id, nombre, precio_usdt, periodo, max_leads, max_embudos, max_miembros, features) VALUES
  ('basico', 'Basico', 27.00, 'mensual', 50, 1, 0, '["Dashboard personal", "Seguimiento de leads (hasta 50)", "1 embudo", "Academia basica", "Soporte por email"]'::jsonb),
  ('pro', 'Pro', 47.00, 'mensual', NULL, 3, 0, '["Todo lo Basico", "Leads ilimitados", "3 embudos", "Pipeline CRM", "Analytics avanzado", "Integraciones (WhatsApp)", "Retos y gamificacion"]'::jsonb),
  ('elite', 'Elite', 97.00, 'mensual', NULL, NULL, NULL, '["Todo lo Pro", "Equipo ilimitado (miembros incluidos)", "Meta Ads dashboard", "Workflows automatizados", "Academia completa", "Soporte prioritario", "White-label (logo personalizado)"]'::jsonb)
ON CONFLICT (id) DO NOTHING;
