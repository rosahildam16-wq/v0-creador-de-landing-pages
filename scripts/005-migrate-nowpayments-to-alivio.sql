-- ============================================
-- Migration: NOWPayments → Alivio Payment
-- Ejecutar en Supabase SQL Editor
-- ============================================

-- 1. Renombrar columnas en subscriptions
ALTER TABLE subscriptions 
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'alivio';

-- Copiar datos existentes (si hay)
UPDATE subscriptions 
  SET payment_id = nowpayments_payment_id 
  WHERE nowpayments_payment_id IS NOT NULL 
    AND payment_id IS NULL;

-- Eliminar columna vieja (solo si la nueva ya existe)
ALTER TABLE subscriptions DROP COLUMN IF EXISTS nowpayments_payment_id;

-- 2. Renombrar columnas en payments
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS provider_payment_id text,
  ADD COLUMN IF NOT EXISTS provider_invoice_id text,
  ADD COLUMN IF NOT EXISTS provider_order_id text,
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'alivio',
  ADD COLUMN IF NOT EXISTS raw_data jsonb;

-- Copiar datos existentes
UPDATE payments 
  SET provider_payment_id = nowpayments_payment_id,
      provider_invoice_id = nowpayments_invoice_id,
      provider_order_id = nowpayments_order_id
  WHERE nowpayments_payment_id IS NOT NULL 
    AND provider_payment_id IS NULL;

-- Eliminar columnas viejas
ALTER TABLE payments 
  DROP COLUMN IF EXISTS nowpayments_payment_id,
  DROP COLUMN IF EXISTS nowpayments_invoice_id,
  DROP COLUMN IF EXISTS nowpayments_order_id,
  DROP COLUMN IF EXISTS pay_address,
  DROP COLUMN IF EXISTS network;

-- 3. Actualizar constraint de status para incluir payment_failed
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check 
  CHECK (status IN ('trial', 'active', 'pending_payment', 'expired', 'cancelled', 'payment_failed'));

-- 4. Crear unique constraint en provider_payment_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment_id_unique 
  ON payments(provider_payment_id) WHERE provider_payment_id IS NOT NULL;

-- 5. Nuevos indices
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);
DROP INDEX IF EXISTS idx_payments_np_id;
DROP INDEX IF EXISTS idx_payments_invoice_id;

-- ✅ Migración completada
SELECT 'Migration NOWPayments → Alivio completed successfully!' AS result;
