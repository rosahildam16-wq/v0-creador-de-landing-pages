-- 005: Add NowPayments recurring subscription columns
-- Adds columns to link local plans/subscriptions with NowPayments recurring IDs

-- Add nowpayments_plan_id to subscription_plans
alter table public.subscription_plans
  add column if not exists nowpayments_plan_id text;

-- Add nowpayments_subscription_id to subscriptions
alter table public.subscriptions
  add column if not exists nowpayments_subscription_id text;

-- Add email to subscriptions for NowPayments recurring emails
alter table public.subscriptions
  add column if not exists subscriber_email text;

-- Index for fast lookups by NowPayments IDs
create index if not exists idx_plans_nowpayments_id
  on public.subscription_plans (nowpayments_plan_id);

create index if not exists idx_subs_nowpayments_id
  on public.subscriptions (nowpayments_subscription_id);
