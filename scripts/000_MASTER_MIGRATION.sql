-- ============================================================
-- MASTER MIGRATION — Magic Funnel / Skalia
-- Ejecutar completo en Supabase SQL Editor (una sola vez)
-- Todos los statements usan IF NOT EXISTS → seguro re-ejecutar
-- ============================================================


-- ============================================================
-- BLOQUE 1: CORE — leads, profiles, community posts
-- ============================================================

-- [001] Función update_updated_at + tablas leads, notas, eventos_actividad
-- CRM Leads Schema for Supabase

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  telefono TEXT NOT NULL DEFAULT '',
  whatsapp TEXT NOT NULL DEFAULT '',
  fuente TEXT NOT NULL DEFAULT 'Organico',
  fecha_ingreso TIMESTAMPTZ NOT NULL DEFAULT now(),
  etapa TEXT NOT NULL DEFAULT 'lead_nuevo',
  video_visto_pct INTEGER NOT NULL DEFAULT 0,
  llamada_contestada BOOLEAN NOT NULL DEFAULT false,
  quiz_completado BOOLEAN NOT NULL DEFAULT false,
  respuestas_quiz JSONB NOT NULL DEFAULT '[]'::jsonb,
  terminal_completado BOOLEAN NOT NULL DEFAULT false,
  whatsapp_leido BOOLEAN NOT NULL DEFAULT false,
  login_completado BOOLEAN NOT NULL DEFAULT false,
  feed_visto BOOLEAN NOT NULL DEFAULT false,
  whatsapp_final_leido BOOLEAN NOT NULL DEFAULT false,
  sales_page_vista BOOLEAN NOT NULL DEFAULT false,
  cta_clicked BOOLEAN NOT NULL DEFAULT false,
  etapa_maxima_alcanzada INTEGER NOT NULL DEFAULT 0,
  tiempo_total_segundos INTEGER NOT NULL DEFAULT 0,
  ultimo_evento TIMESTAMPTZ NOT NULL DEFAULT now(),
  asignado_a TEXT NOT NULL DEFAULT 'Sin asignar',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leads_etapa ON public.leads(etapa);
CREATE INDEX IF NOT EXISTS idx_leads_fuente ON public.leads(fuente);
CREATE INDEX IF NOT EXISTS idx_leads_fecha_ingreso ON public.leads(fecha_ingreso DESC);
CREATE INDEX IF NOT EXISTS idx_leads_email ON public.leads(email);

CREATE TABLE IF NOT EXISTS public.notas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  texto TEXT NOT NULL,
  autor TEXT NOT NULL DEFAULT 'Sistema',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notas_lead_id ON public.notas(lead_id);

CREATE TABLE IF NOT EXISTS public.eventos_actividad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_eventos_lead_id ON public.eventos_actividad(lead_id);
CREATE INDEX IF NOT EXISTS idx_eventos_created_at ON public.eventos_actividad(created_at DESC);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eventos_actividad ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_allow_all" ON public.leads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "notas_allow_all" ON public.notas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "eventos_allow_all" ON public.eventos_actividad FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leads_updated_at ON public.leads;
CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();


-- [002] Tabla profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  role text default 'member' check (role in ('admin', 'member', 'moderator')),
  points integer default 0,
  level integer default 1,
  badge text default 'Bronce',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_all" on public.profiles
  for select using (true);

create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at
  before update on public.profiles
  for each row
  execute function public.update_updated_at();


-- [003] Tablas community posts, likes, comments, bookmarks
create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  category text default 'General',
  image_url text,
  is_pinned boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.community_posts enable row level security;
create policy "posts_select_all" on public.community_posts for select using (true);
create policy "posts_insert_own" on public.community_posts for insert with check (auth.uid() = user_id);
create policy "posts_update_own" on public.community_posts for update using (auth.uid() = user_id);
create policy "posts_delete_own" on public.community_posts for delete using (auth.uid() = user_id);

create index if not exists idx_community_posts_user on public.community_posts(user_id);
create index if not exists idx_community_posts_category on public.community_posts(category);
create index if not exists idx_community_posts_created on public.community_posts(created_at desc);

create table if not exists public.community_likes (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

alter table public.community_likes enable row level security;
create policy "likes_select_all" on public.community_likes for select using (true);
create policy "likes_insert_own" on public.community_likes for insert with check (auth.uid() = user_id);
create policy "likes_delete_own" on public.community_likes for delete using (auth.uid() = user_id);
create index if not exists idx_community_likes_post on public.community_likes(post_id);

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

alter table public.community_comments enable row level security;
create policy "comments_select_all" on public.community_comments for select using (true);
create policy "comments_insert_own" on public.community_comments for insert with check (auth.uid() = user_id);
create policy "comments_delete_own" on public.community_comments for delete using (auth.uid() = user_id);
create index if not exists idx_community_comments_post on public.community_comments(post_id);

create table if not exists public.community_bookmarks (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  unique(post_id, user_id)
);

alter table public.community_bookmarks enable row level security;
create policy "bookmarks_select_own" on public.community_bookmarks for select using (auth.uid() = user_id);
create policy "bookmarks_insert_own" on public.community_bookmarks for insert with check (auth.uid() = user_id);
create policy "bookmarks_delete_own" on public.community_bookmarks for delete using (auth.uid() = user_id);

drop trigger if exists community_posts_updated_at on public.community_posts;
create trigger community_posts_updated_at
  before update on public.community_posts
  for each row
  execute function public.update_updated_at();


-- ============================================================
-- BLOQUE 2: SUSCRIPCIONES Y COMUNIDADES BASE
-- ============================================================

-- [004-subscriptions] subscription_plans, subscriptions, payments
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
  payment_id text,
  payment_method text DEFAULT 'alivio',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  provider_payment_id text UNIQUE,
  provider_invoice_id text,
  provider_order_id text,
  provider text DEFAULT 'alivio',
  amount_usdt numeric(10,2),
  status text DEFAULT 'waiting' CHECK (status IN ('waiting', 'confirming', 'confirmed', 'finished', 'failed', 'expired', 'refunded')),
  raw_data jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_email ON subscriptions(user_email);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_paid_by ON subscriptions(paid_by);
CREATE INDEX IF NOT EXISTS idx_payments_provider_id ON payments(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_subscription ON payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider ON payments(provider);

INSERT INTO subscription_plans (id, nombre, precio_usdt, periodo, max_leads, max_embudos, max_miembros, features) VALUES
  ('basico', 'Basico', 27.00, 'mensual', 50, 1, 0, '["Dashboard personal", "Seguimiento de leads (hasta 50)", "1 embudo", "Academia basica", "Soporte por email"]'::jsonb),
  ('pro', 'Pro', 47.00, 'mensual', NULL, 3, 0, '["Todo lo Basico", "Leads ilimitados", "3 embudos", "Pipeline CRM", "Analytics avanzado", "Integraciones (WhatsApp)", "Retos y gamificacion"]'::jsonb),
  ('elite', 'Elite', 97.00, 'mensual', NULL, NULL, NULL, '["Todo lo Pro", "Equipo ilimitado (miembros incluidos)", "Meta Ads dashboard", "Workflows automatizados", "Academia completa", "Soporte prioritario", "White-label (logo personalizado)"]'::jsonb)
ON CONFLICT (id) DO NOTHING;


-- [010] communities, community_members, admin_notifications
CREATE TABLE IF NOT EXISTS public.communities (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  codigo TEXT UNIQUE,
  descripcion TEXT,
  color TEXT DEFAULT '#8b5cf6',
  embudos_default TEXT[] DEFAULT '{}',
  leader_email TEXT,
  leader_name TEXT,
  cuota_miembro NUMERIC DEFAULT 0,
  activa BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "communities_select_all" ON public.communities FOR SELECT USING (true);
CREATE POLICY "communities_insert_admin" ON public.communities FOR INSERT WITH CHECK (true);
CREATE POLICY "communities_update_admin" ON public.communities FOR UPDATE USING (true);
CREATE POLICY "communities_delete_admin" ON public.communities FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.community_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL,
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  discount_code TEXT,
  embudos_asignados TEXT[] DEFAULT '{}',
  role TEXT DEFAULT 'member' CHECK (role IN ('leader', 'member')),
  activo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "members_select_all" ON public.community_members FOR SELECT USING (true);
CREATE POLICY "members_insert_all" ON public.community_members FOR INSERT WITH CHECK (true);
CREATE POLICY "members_update_all" ON public.community_members FOR UPDATE USING (true);
CREATE POLICY "members_delete_all" ON public.community_members FOR DELETE USING (true);

CREATE UNIQUE INDEX IF NOT EXISTS idx_member_email ON public.community_members(email);

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT DEFAULT 'team',
  titulo TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  destinatario TEXT DEFAULT 'admin',
  leida BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications_select_all" ON public.admin_notifications FOR SELECT USING (true);
CREATE POLICY "notifications_insert_all" ON public.admin_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update_all" ON public.admin_notifications FOR UPDATE USING (true);

INSERT INTO public.communities (id, nombre, codigo, descripcion, color, embudos_default, leader_email, leader_name, cuota_miembro, activa)
VALUES
  ('skalia-vip', 'Skalia VIP', 'DIAMANTECELION', 'Comunidad exclusiva del equipo Skalia. Acceso completo a herramientas premium y embudos especializados.', '#8b5cf6', ARRAY['franquicia-reset'], 'iajorgeleon21@gmail.com', 'Jorge Leon', 10, true),
  ('general', 'General', NULL, 'Usuarios registrados sin comunidad especifica. Acceso basico a la plataforma.', '#6366f1', '{}', NULL, NULL, 0, true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- BLOQUE 3: EXTENSIONES BASE
-- ============================================================

-- [004-add-ghl] GHL tracking columns + tablas
ALTER TABLE leads ADD COLUMN IF NOT EXISTS campana text DEFAULT '';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS embudo_id text DEFAULT 'nomada-vip';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tipo_embudo text DEFAULT 'cita';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS whatsapp_cita_enviado boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS compra_completada boolean DEFAULT false;

CREATE TABLE IF NOT EXISTS ghl_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  embudo_id text NOT NULL DEFAULT '',
  embudo_nombre text,
  lead_email text NOT NULL,
  lead_nombre text NOT NULL,
  method text NOT NULL CHECK (method IN ('api', 'webhook')),
  action text NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'error', 'rejected')),
  http_code integer,
  contact_id text,
  attempt integer DEFAULT 1,
  max_attempts integer DEFAULT 1,
  elapsed text,
  tag text DEFAULT '',
  payload_sent jsonb DEFAULT '{}',
  response_body text,
  error text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ghl_logs_embudo ON ghl_logs(embudo_id);
CREATE INDEX IF NOT EXISTS idx_ghl_logs_status ON ghl_logs(status);
CREATE INDEX IF NOT EXISTS idx_ghl_logs_created ON ghl_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS ghl_config (
  id text PRIMARY KEY DEFAULT 'default',
  webhook_url text DEFAULT '',
  api_key text DEFAULT '',
  location_id text DEFAULT '',
  base_url text DEFAULT 'https://services.leadconnectorhq.com',
  api_version text DEFAULT '2021-07-28',
  default_source text DEFAULT 'magic-funnel',
  timeout_ms integer DEFAULT 10000,
  retry_count integer DEFAULT 2,
  updated_at timestamptz DEFAULT now()
);

INSERT INTO ghl_config (id) VALUES ('default') ON CONFLICT (id) DO NOTHING;


-- [005] Migración NOWPayments → Alivio
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS payment_id text,
  ADD COLUMN IF NOT EXISTS payment_method text DEFAULT 'alivio';

ALTER TABLE subscriptions DROP COLUMN IF EXISTS nowpayments_payment_id;

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS provider_payment_id text,
  ADD COLUMN IF NOT EXISTS provider_invoice_id text,
  ADD COLUMN IF NOT EXISTS provider_order_id text,
  ADD COLUMN IF NOT EXISTS provider text DEFAULT 'alivio',
  ADD COLUMN IF NOT EXISTS raw_data jsonb;

ALTER TABLE payments
  DROP COLUMN IF EXISTS nowpayments_payment_id,
  DROP COLUMN IF EXISTS nowpayments_invoice_id,
  DROP COLUMN IF EXISTS nowpayments_order_id,
  DROP COLUMN IF EXISTS pay_address,
  DROP COLUMN IF EXISTS network;

ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_status_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_status_check
  CHECK (status IN ('trial', 'active', 'pending_payment', 'expired', 'cancelled', 'payment_failed'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_provider_payment_id_unique
  ON payments(provider_payment_id) WHERE provider_payment_id IS NOT NULL;

DROP INDEX IF EXISTS idx_payments_np_id;
DROP INDEX IF EXISTS idx_payments_invoice_id;


-- [011] sponsor_name en community_members
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS sponsor_name TEXT DEFAULT NULL;


-- [011] member_integrations, appointments + settings en communities
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"zoom_enabled": false, "calendar_enabled": false, "whatsapp_reminders_enabled": false}'::jsonb;

CREATE TABLE IF NOT EXISTS public.member_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expiry_date BIGINT,
  email TEXT,
  phone TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(member_id, provider)
);

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  meeting_link TEXT,
  provider TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.member_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "integrations_allow_all" ON public.member_integrations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "appointments_allow_all" ON public.appointments FOR ALL USING (true) WITH CHECK (true);


-- [012] Booking module
CREATE TABLE IF NOT EXISTS booking_calendars (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_email text NOT NULL,
    slug text UNIQUE NOT NULL,
    name text NOT NULL,
    description text,
    type text DEFAULT '1:1' CHECK (type IN ('1:1', 'group')),
    duration_minutes integer DEFAULT 30,
    timezone text DEFAULT 'America/Mexico_City',
    location_type text DEFAULT 'google_meet',
    location_value text,
    max_bookings_per_day integer DEFAULT 8,
    min_notice_hours integer DEFAULT 2,
    buffer_before_minutes integer DEFAULT 0,
    buffer_after_minutes integer DEFAULT 10,
    max_group_size integer DEFAULT 1,
    confirmation_message text DEFAULT 'Tu cita ha sido agendada exitosamente. Te esperamos!',
    confirmation_cta_url text,
    confirmation_cta_label text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time time NOT NULL,
    end_time time NOT NULL,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS blackout_dates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
    date date NOT NULL,
    reason text,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
    label text NOT NULL,
    type text DEFAULT 'text' CHECK (type IN ('text', 'email', 'phone', 'select', 'textarea')),
    placeholder text,
    required boolean DEFAULT true,
    options jsonb,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
    start_time timestamptz NOT NULL,
    end_time timestamptz NOT NULL,
    status text DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','rescheduled','no_show','completed')),
    guest_name text NOT NULL,
    guest_email text NOT NULL,
    guest_phone text,
    guest_answers jsonb DEFAULT '{}',
    cancel_token text UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    reschedule_token text UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
    cancelled_at timestamptz,
    cancel_reason text,
    rescheduled_from uuid REFERENCES bookings(id),
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notification_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (event_type IN ('confirmation','reminder','cancellation','reschedule')),
    channel text DEFAULT 'email' CHECK (channel IN ('email', 'whatsapp')),
    timing_minutes integer DEFAULT 0,
    template text,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS booking_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calendars_owner ON booking_calendars(owner_email);
CREATE INDEX IF NOT EXISTS idx_calendars_slug ON booking_calendars(slug);
CREATE INDEX IF NOT EXISTS idx_availability_calendar ON availability_rules(calendar_id);
CREATE INDEX IF NOT EXISTS idx_blackout_calendar ON blackout_dates(calendar_id);
CREATE INDEX IF NOT EXISTS idx_bookings_calendar ON bookings(calendar_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_audit_booking ON booking_audit_log(booking_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_no_overlap
    ON bookings(calendar_id, start_time)
    WHERE status NOT IN ('cancelled', 'rescheduled');

ALTER TABLE booking_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "booking_calendars_all" ON booking_calendars FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "availability_rules_all" ON availability_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "blackout_dates_all" ON blackout_dates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "booking_questions_all" ON booking_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "bookings_all" ON bookings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "notification_rules_all" ON notification_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "booking_audit_log_all" ON booking_audit_log FOR ALL USING (true) WITH CHECK (true);


-- [012] Trial columns
ALTER TABLE communities ADD COLUMN IF NOT EXISTS free_trial_days integer DEFAULT NULL;
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS trial_ends_at timestamptz DEFAULT NULL;
UPDATE communities SET free_trial_days = 30 WHERE id = 'skalia-vip';


-- [012] Social centers
CREATE TABLE IF NOT EXISTS public.social_centers (
  username TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  theme_config JSONB DEFAULT '{
    "primary_color": "#8b5cf6",
    "bg_style": "glass_mesh",
    "layout": "list",
    "button_style": "glass"
  }'::JSONB,
  links JSONB DEFAULT '[]'::JSONB,
  social_links JSONB DEFAULT '{}'::JSONB,
  views_count INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.social_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_centers_select_all" ON public.social_centers FOR SELECT USING (true);
CREATE POLICY "social_centers_access_all" ON public.social_centers FOR ALL USING (true) WITH CHECK (true);


-- [013] Fix booking permissions — GRANTS globales
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;


-- [013] Username system
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS sponsor_username TEXT;
ALTER TABLE communities ADD COLUMN IF NOT EXISTS owner_username TEXT;

CREATE INDEX IF NOT EXISTS idx_cm_username ON community_members(username);
CREATE INDEX IF NOT EXISTS idx_cm_sponsor ON community_members(sponsor_username);
CREATE INDEX IF NOT EXISTS idx_comm_owner ON communities(owner_username);


-- [013] Leads extra columns + social_visits
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS pais TEXT,
ADD COLUMN IF NOT EXISTS trafico TEXT DEFAULT 'Organico' CHECK (trafico IN ('Organico', 'Pauta'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_member_username ON public.community_members(username);

CREATE TABLE IF NOT EXISTS public.social_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  visitor_ip TEXT,
  user_agent TEXT,
  referer TEXT,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_social_visits_username ON public.social_visits(username);


-- ============================================================
-- BLOQUE 4: FEATURES
-- ============================================================

-- [014] Community resources
CREATE TABLE IF NOT EXISTS public.community_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id TEXT NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  category TEXT DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by TEXT,
  is_public BOOLEAN DEFAULT true
);

ALTER TABLE public.community_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources_select_all" ON public.community_resources FOR SELECT USING (true);
CREATE POLICY "resources_insert_all" ON public.community_resources FOR INSERT WITH CHECK (true);
CREATE POLICY "resources_update_all" ON public.community_resources FOR UPDATE USING (true);
CREATE POLICY "resources_delete_all" ON public.community_resources FOR DELETE USING (true);
CREATE INDEX IF NOT EXISTS idx_resources_comm ON public.community_resources(community_id);


-- [015] Meta Ads config
CREATE TABLE IF NOT EXISTS public.meta_ads_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL,
  ad_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  pixel_id TEXT,
  pixel_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(member_id)
);

ALTER TABLE public.meta_ads_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meta_config_allow_all" ON public.meta_ads_config FOR ALL USING (true) WITH CHECK (true);


-- [016] Email campaigns
CREATE TABLE IF NOT EXISTS public.campanas_email (
    id TEXT PRIMARY KEY,
    titulo TEXT NOT NULL,
    asunto TEXT NOT NULL,
    contenido_html TEXT NOT NULL,
    audiencia TEXT NOT NULL,
    audience_filters JSONB DEFAULT '{}'::jsonb,
    community_id TEXT,
    programado_para TIMESTAMP WITH TIME ZONE,
    enviado_en TIMESTAMP WITH TIME ZONE,
    estado TEXT NOT NULL DEFAULT 'borrador',
    autor_id TEXT,
    autor_role TEXT,
    leads_alcanzados INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.campanas_email ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "campanas_select_all" ON public.campanas_email;
CREATE POLICY "campanas_select_all" ON public.campanas_email FOR SELECT USING (true);
DROP POLICY IF EXISTS "campanas_insert_all" ON public.campanas_email;
CREATE POLICY "campanas_insert_all" ON public.campanas_email FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "campanas_update_all" ON public.campanas_email;
CREATE POLICY "campanas_update_all" ON public.campanas_email FOR UPDATE USING (true);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='communities' AND column_name='mailing_enabled') THEN
        ALTER TABLE public.communities ADD COLUMN mailing_enabled BOOLEAN DEFAULT false;
    END IF;
END $$;


-- [017] Settings en communities (update con más opciones)
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"zoom_enabled": true, "calendar_enabled": true, "whatsapp_reminders_enabled": true, "agenda_enabled": true, "mailing_enabled": true}'::jsonb;


-- [017] Email sequences + sequence steps + enrollments + lead_tags
CREATE TABLE IF NOT EXISTS public.email_sequences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    trigger_type TEXT NOT NULL DEFAULT 'manual',
    trigger_value TEXT DEFAULT '',
    estado TEXT NOT NULL DEFAULT 'borrador',
    community_id TEXT DEFAULT 'general',
    autor_id TEXT DEFAULT '',
    autor_role TEXT DEFAULT 'admin',
    total_enrolled INT DEFAULT 0,
    total_completed INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_sequence_steps (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
    step_order INT NOT NULL DEFAULT 0,
    asunto TEXT NOT NULL DEFAULT '',
    contenido_html TEXT NOT NULL DEFAULT '',
    delay_days INT NOT NULL DEFAULT 0,
    delay_hours INT NOT NULL DEFAULT 0,
    condition_type TEXT DEFAULT 'none',
    condition_value TEXT DEFAULT '',
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.email_sequence_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    sequence_id UUID NOT NULL REFERENCES public.email_sequences(id) ON DELETE CASCADE,
    lead_id TEXT NOT NULL,
    lead_email TEXT NOT NULL,
    lead_nombre TEXT DEFAULT '',
    current_step INT DEFAULT 0,
    estado TEXT NOT NULL DEFAULT 'activa',
    enrolled_at TIMESTAMPTZ DEFAULT now(),
    next_send_at TIMESTAMPTZ,
    last_sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(sequence_id, lead_id)
);

CREATE TABLE IF NOT EXISTS public.lead_tags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    lead_id TEXT NOT NULL,
    tag TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(lead_id, tag)
);

ALTER TABLE public.email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_email_sequences" ON public.email_sequences FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_email_sequence_steps" ON public.email_sequence_steps FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_email_sequence_enrollments" ON public.email_sequence_enrollments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_lead_tags" ON public.lead_tags FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_enrollments_next_send ON public.email_sequence_enrollments(next_send_at) WHERE estado = 'activa';
CREATE INDEX IF NOT EXISTS idx_enrollments_sequence ON public.email_sequence_enrollments(sequence_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_lead ON public.lead_tags(lead_id);


-- [setup-pixel-config] pixel_config
CREATE TABLE IF NOT EXISTS pixel_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  embudo_id TEXT NOT NULL UNIQUE DEFAULT 'global',
  pixel_id TEXT NOT NULL DEFAULT '',
  pixel_token TEXT DEFAULT '',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pixel_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_all_pixel" ON pixel_config FOR ALL USING (true) WITH CHECK (true);


-- [setup-sequences-tables] tags en leads + sequence_enrollments + sequence_email_logs
ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

CREATE TABLE IF NOT EXISTS sequence_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id UUID NOT NULL REFERENCES email_sequences(id) ON DELETE CASCADE,
  lead_id TEXT NOT NULL,
  lead_email TEXT NOT NULL,
  lead_nombre TEXT DEFAULT '',
  estado TEXT NOT NULL DEFAULT 'activo',
  current_step INTEGER NOT NULL DEFAULT 0,
  next_send_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sequence_id, lead_id)
);

CREATE TABLE IF NOT EXISTS sequence_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID REFERENCES sequence_enrollments(id) ON DELETE CASCADE,
  sequence_id UUID REFERENCES email_sequences(id) ON DELETE CASCADE,
  step_index INTEGER DEFAULT 0,
  lead_email TEXT NOT NULL,
  asunto TEXT DEFAULT '',
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_seq_trigger ON email_sequences(trigger_type, trigger_value, estado);
CREATE INDEX IF NOT EXISTS idx_email_seq_community ON email_sequences(community_id);
CREATE INDEX IF NOT EXISTS idx_seq_steps_sequence ON email_sequence_steps(sequence_id, step_order);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON sequence_enrollments(estado, next_send_at);
CREATE INDEX IF NOT EXISTS idx_enrollments_lead ON sequence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_tags ON leads USING GIN(tags);

ALTER TABLE sequence_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sequence_email_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_all_enrollments" ON sequence_enrollments FOR ALL USING (true);
CREATE POLICY "service_all_logs" ON sequence_email_logs FOR ALL USING (true);


-- ============================================================
-- BLOQUE 5: RBAC, SEGURIDAD Y ADMIN
-- ============================================================

-- [020] admin_roles, audit_logs
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN (
                  'super_admin',
                  'admin',
                  'finance_admin',
                  'support_admin',
                  'compliance_admin'
                )),
  granted_by    TEXT NOT NULL,
  active        BOOLEAN NOT NULL DEFAULT true,
  revoked_at    TIMESTAMP WITH TIME ZONE,
  revoked_by    TEXT,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_admin_roles_user_active
  ON public.admin_roles (user_id)
  WHERE active = true;

CREATE INDEX IF NOT EXISTS idx_admin_roles_role
  ON public.admin_roles (role)
  WHERE active = true;

ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_roles_no_public_select" ON public.admin_roles FOR SELECT USING (false);
CREATE POLICY "admin_roles_no_public_insert" ON public.admin_roles FOR INSERT WITH CHECK (false);
CREATE POLICY "admin_roles_no_public_update" ON public.admin_roles FOR UPDATE USING (false);
CREATE POLICY "admin_roles_no_public_delete" ON public.admin_roles FOR DELETE USING (false);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  TEXT NOT NULL,
  actor_role     TEXT NOT NULL,
  action_type    TEXT NOT NULL,
  target_type    TEXT,
  target_id      TEXT,
  payload        JSONB,
  reason         TEXT,
  ip             TEXT,
  user_agent     TEXT,
  timestamp      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "audit_logs_no_public_select" ON public.audit_logs FOR SELECT USING (false);
CREATE POLICY "audit_logs_insert_deny" ON public.audit_logs FOR INSERT WITH CHECK (false);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs (actor_user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs (target_type, target_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs (timestamp DESC);


-- [021] Phase 2 core: community_plans, community_memberships, platform_plans,
--       user_platform_subscription, referrals, commissions, payouts
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS slug TEXT;
UPDATE public.communities SET slug = id WHERE slug IS NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_communities_slug ON public.communities (slug);
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS allow_trial BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS default_trial_days INTEGER NOT NULL DEFAULT 7;

CREATE TABLE IF NOT EXISTS public.community_plans (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id  TEXT          NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  name          TEXT          NOT NULL,
  price         NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency      TEXT          NOT NULL DEFAULT 'USD',
  interval      TEXT          NOT NULL DEFAULT 'monthly'
                  CHECK (interval IN ('weekly','monthly','quarterly','yearly','one_time')),
  trial_days    INTEGER       NOT NULL DEFAULT 7,
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_plans_community ON public.community_plans (community_id) WHERE is_active = true;
ALTER TABLE public.community_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_plans_no_public" ON public.community_plans FOR ALL USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.community_memberships (
  id                   UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id         TEXT          NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  user_id              TEXT          NOT NULL,
  plan_id              UUID          REFERENCES public.community_plans(id) ON DELETE SET NULL,
  status               TEXT          NOT NULL DEFAULT 'active'
                         CHECK (status IN ('trialing','active','past_due','frozen','canceled')),
  trial_start          TIMESTAMPTZ,
  trial_end            TIMESTAMPTZ,
  current_period_start TIMESTAMPTZ,
  current_period_end   TIMESTAMPTZ,
  grace_until          TIMESTAMPTZ,
  created_at           TIMESTAMPTZ   DEFAULT now(),
  updated_at           TIMESTAMPTZ   DEFAULT now(),
  UNIQUE (community_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_memberships_user ON public.community_memberships (user_id);
CREATE INDEX IF NOT EXISTS idx_community_memberships_status ON public.community_memberships (status);
CREATE INDEX IF NOT EXISTS idx_community_memberships_trial_end ON public.community_memberships (trial_end) WHERE status = 'trialing';
ALTER TABLE public.community_memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_memberships_no_public" ON public.community_memberships FOR ALL USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.platform_plans (
  code        TEXT          PRIMARY KEY,
  name        TEXT          NOT NULL,
  price       NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency    TEXT          NOT NULL DEFAULT 'USD',
  interval    TEXT          NOT NULL DEFAULT 'monthly',
  trial_days  INTEGER       NOT NULL DEFAULT 0,
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  limits      JSONB         NOT NULL DEFAULT '{}',
  created_at  TIMESTAMPTZ   DEFAULT now()
);

ALTER TABLE public.platform_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_plans_public_read" ON public.platform_plans FOR SELECT USING (is_active = true);
CREATE POLICY "platform_plans_no_public_write" ON public.platform_plans FOR INSERT WITH CHECK (false);

INSERT INTO public.platform_plans (code, name, price, interval, trial_days, limits)
VALUES
  ('student', 'Estudiante', 0.00, 'monthly', 0, '{"funnels_max": 0, "communities_max": 0, "contacts_max": 0, "can_create_community": false, "can_create_funnel": false, "commission_cap_monthly": null, "tools": ["community_content", "academy_videos", "resources"]}'::jsonb),
  ('plan_27', 'Member', 27.00, 'monthly', 7, '{"funnels_max": 0, "communities_max": 0, "contacts_max": 500, "can_create_community": false, "can_create_funnel": false, "commission_cap_monthly": null, "tools": ["community_content", "academy_videos", "resources", "crm_community"]}'::jsonb),
  ('plan_47', 'Creator', 47.00, 'monthly', 7, '{"funnels_max": 3, "communities_max": 3, "contacts_max": -1, "can_create_community": true, "can_create_funnel": true, "commission_cap_monthly": 1500, "tools": ["community_content", "academy_videos", "resources", "crm_community", "crm_global", "funnel_builder", "integrations", "booking"]}'::jsonb),
  ('plan_97', 'Elite', 97.00, 'monthly', 7, '{"funnels_max": -1, "communities_max": -1, "contacts_max": -1, "can_create_community": true, "can_create_funnel": true, "commission_cap_monthly": 10000, "tools": ["community_content", "academy_videos", "resources", "crm_community", "crm_global", "funnel_builder", "integrations", "booking", "meta_ads", "workflows", "team_management"]}'::jsonb),
  ('plan_300', 'Club', 300.00, 'monthly', 7, '{"funnels_max": -1, "communities_max": -1, "contacts_max": -1, "can_create_community": true, "can_create_funnel": true, "commission_cap_monthly": null, "tools": ["community_content", "academy_videos", "resources", "crm_community", "crm_global", "funnel_builder", "integrations", "booking", "meta_ads", "workflows", "team_management", "white_label"]}'::jsonb)
ON CONFLICT (code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_platform_subscription (
  id                      UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 TEXT          NOT NULL UNIQUE,
  platform_plan_code      TEXT          NOT NULL DEFAULT 'student' REFERENCES public.platform_plans(code),
  status                  TEXT          NOT NULL DEFAULT 'active' CHECK (status IN ('trialing','active','past_due','canceled')),
  trial_start             TIMESTAMPTZ,
  trial_end               TIMESTAMPTZ,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  downgrade_to_student_at TIMESTAMPTZ,
  created_at              TIMESTAMPTZ   DEFAULT now(),
  updated_at              TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ups_status ON public.user_platform_subscription (status);
CREATE INDEX IF NOT EXISTS idx_ups_trial_end ON public.user_platform_subscription (trial_end) WHERE status = 'trialing';
CREATE INDEX IF NOT EXISTS idx_ups_downgrade ON public.user_platform_subscription (downgrade_to_student_at) WHERE downgrade_to_student_at IS NOT NULL;
ALTER TABLE public.user_platform_subscription ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ups_no_public" ON public.user_platform_subscription FOR ALL USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.referrals (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT        NOT NULL UNIQUE,
  sponsor_user_id TEXT        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_referrals_sponsor ON public.referrals (sponsor_user_id);

CREATE OR REPLACE FUNCTION public.fn_referrals_immutable()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION
    'referrals are immutable: sponsor cannot be changed once set (compliance rule). user_id=%, attempted sponsor=%',
    OLD.user_id, NEW.sponsor_user_id;
END;
$$;

DROP TRIGGER IF EXISTS trg_referrals_immutable ON public.referrals;
CREATE TRIGGER trg_referrals_immutable
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.fn_referrals_immutable();

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals_no_public" ON public.referrals FOR ALL USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.commissions (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  payer_user_id          TEXT          NOT NULL,
  platform_plan_code     TEXT          NOT NULL REFERENCES public.platform_plans(code),
  sponsor_level1_user_id TEXT,
  sponsor_level2_user_id TEXT,
  level1_amount          NUMERIC(10,2) DEFAULT 0,
  level2_amount          NUMERIC(10,2) DEFAULT 0,
  currency               TEXT          NOT NULL DEFAULT 'USD',
  period_start           TIMESTAMPTZ   NOT NULL,
  period_end             TIMESTAMPTZ   NOT NULL,
  status                 TEXT          NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','payable','paid','held','void')),
  reason                 TEXT,
  metadata               JSONB,
  created_at             TIMESTAMPTZ   DEFAULT now(),
  updated_at             TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_commissions_level1_period ON public.commissions (sponsor_level1_user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_commissions_level2_period ON public.commissions (sponsor_level2_user_id, period_start);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON public.commissions (status);
CREATE INDEX IF NOT EXISTS idx_commissions_payer ON public.commissions (payer_user_id);
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commissions_no_public" ON public.commissions FOR ALL USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.payouts (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT          NOT NULL,
  amount     NUMERIC(10,2) NOT NULL CHECK (amount >= 50),
  currency   TEXT          NOT NULL DEFAULT 'USD',
  status     TEXT          NOT NULL DEFAULT 'queued' CHECK (status IN ('queued','sent','paid','failed')),
  notes      TEXT,
  created_at TIMESTAMPTZ   DEFAULT now(),
  paid_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_payouts_user ON public.payouts (user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payouts (status);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts_no_public" ON public.payouts FOR ALL USING (false) WITH CHECK (false);


-- [022] Security constraints (triggers compliance)
CREATE OR REPLACE FUNCTION fn_check_super_admin_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_count INT;
BEGIN
  IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.active = true)) THEN
    IF NEW.role = 'super_admin' AND NEW.active = true THEN
      SELECT COUNT(*) INTO current_count
        FROM public.admin_roles
       WHERE role = 'super_admin'
         AND active = true
         AND id IS DISTINCT FROM NEW.id;

      IF current_count >= 2 THEN
        RAISE EXCEPTION
          'COMPLIANCE: Maximum of 2 active super_admin accounts allowed. Current: %. Revoke an existing super_admin first.',
          current_count;
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_super_admin_limit ON public.admin_roles;
CREATE TRIGGER trg_super_admin_limit
  BEFORE INSERT OR UPDATE ON public.admin_roles
  FOR EACH ROW EXECUTE FUNCTION fn_check_super_admin_limit();

CREATE OR REPLACE FUNCTION fn_audit_sponsor_change_attempt()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    actor_user_id, actor_role, action_type, target_type, target_id, payload, reason, timestamp
  ) VALUES (
    current_setting('app.actor_user_id', true),
    current_setting('app.actor_role',    true),
    'sponsor_change_attempt',
    'referral',
    OLD.id::TEXT,
    jsonb_build_object(
      'user_id',          OLD.user_id,
      'current_sponsor',  OLD.sponsor_user_id,
      'attempted_sponsor', NEW.sponsor_user_id
    ),
    'Blocked by compliance — sponsor is permanently locked',
    now()
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_sponsor_change ON public.referrals;
CREATE TRIGGER trg_audit_sponsor_change
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION fn_audit_sponsor_change_attempt();


-- [023] 2FA para admins
CREATE TABLE IF NOT EXISTS public.admin_2fa (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       TEXT NOT NULL UNIQUE,
  totp_secret   TEXT NOT NULL,
  backup_codes  TEXT[] NOT NULL DEFAULT '{}',
  enabled       BOOLEAN NOT NULL DEFAULT false,
  verified_at   TIMESTAMP WITH TIME ZONE,
  last_used_at  TIMESTAMP WITH TIME ZONE,
  created_at    TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at    TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_2fa_user ON public.admin_2fa (user_id);
ALTER TABLE public.admin_2fa ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_2fa_no_public_select" ON public.admin_2fa FOR SELECT USING (false);
CREATE POLICY "admin_2fa_no_public_insert" ON public.admin_2fa FOR INSERT WITH CHECK (false);
CREATE POLICY "admin_2fa_no_public_update" ON public.admin_2fa FOR UPDATE USING (false);
CREATE POLICY "admin_2fa_no_public_delete" ON public.admin_2fa FOR DELETE USING (false);

CREATE TABLE IF NOT EXISTS public.admin_2fa_challenges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  challenge_token TEXT NOT NULL UNIQUE,
  expires_at      TIMESTAMP WITH TIME ZONE NOT NULL,
  used            BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_2fa_challenges_token  ON public.admin_2fa_challenges (challenge_token) WHERE used = false;
CREATE INDEX IF NOT EXISTS idx_2fa_challenges_user   ON public.admin_2fa_challenges (user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_challenges_expiry ON public.admin_2fa_challenges (expires_at);
ALTER TABLE public.admin_2fa_challenges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_2fa_challenges_no_public" ON public.admin_2fa_challenges FOR ALL USING (false);


-- [024] Pricing extensions
ALTER TABLE public.platform_plans ADD COLUMN IF NOT EXISTS annual_price NUMERIC(10,2);
UPDATE public.platform_plans SET annual_price = ROUND(price * 12 * 0.80, 2) WHERE annual_price IS NULL AND price > 0;
UPDATE public.platform_plans SET annual_price = 0 WHERE code = 'student';

ALTER TABLE public.user_platform_subscription
  ADD COLUMN IF NOT EXISTS billing_interval TEXT NOT NULL DEFAULT 'monthly'
    CHECK (billing_interval IN ('monthly', 'annual'));

CREATE TABLE IF NOT EXISTS public.community_price_overrides (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  community_id    TEXT          NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  plan_code       TEXT          NOT NULL REFERENCES public.platform_plans(code) ON DELETE CASCADE,
  monthly_price   NUMERIC(10,2) NOT NULL,
  annual_price    NUMERIC(10,2),
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  note            TEXT,
  created_by      TEXT,
  created_at      TIMESTAMPTZ   DEFAULT now(),
  updated_at      TIMESTAMPTZ   DEFAULT now(),
  UNIQUE (community_id, plan_code)
);

CREATE INDEX IF NOT EXISTS idx_cpo_community ON public.community_price_overrides (community_id) WHERE is_active = true;
ALTER TABLE public.community_price_overrides ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cpo_no_public" ON public.community_price_overrides FOR ALL USING (false) WITH CHECK (false);

CREATE TABLE IF NOT EXISTS public.user_discounts (
  id             UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT          NOT NULL,
  plan_code      TEXT          REFERENCES public.platform_plans(code) ON DELETE SET NULL,
  discount_type  TEXT          NOT NULL DEFAULT 'pct' CHECK (discount_type IN ('pct', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value >= 0),
  billing_scope  TEXT          NOT NULL DEFAULT 'both' CHECK (billing_scope IN ('monthly', 'annual', 'both')),
  valid_from     TIMESTAMPTZ   NOT NULL DEFAULT now(),
  valid_until    TIMESTAMPTZ,
  max_uses       INTEGER,
  used_count     INTEGER       NOT NULL DEFAULT 0,
  is_active      BOOLEAN       NOT NULL DEFAULT true,
  reason         TEXT,
  created_by     TEXT          NOT NULL,
  revoked_by     TEXT,
  revoked_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ   DEFAULT now(),
  updated_at     TIMESTAMPTZ   DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_discounts_user ON public.user_discounts (user_id) WHERE is_active = true;
ALTER TABLE public.user_discounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_discounts_no_public" ON public.user_discounts FOR ALL USING (false) WITH CHECK (false);

CREATE OR REPLACE FUNCTION public.fn_resolve_price(
  p_user_id     TEXT,
  p_plan_code   TEXT,
  p_community_id TEXT,
  p_interval    TEXT
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_monthly   NUMERIC;
  v_base_annual    NUMERIC;
  v_base           NUMERIC;
  v_override_row   RECORD;
  v_discount_row   RECORD;
  v_result         NUMERIC;
BEGIN
  SELECT price, annual_price INTO v_base_monthly, v_base_annual
    FROM public.platform_plans WHERE code = p_plan_code AND is_active = true LIMIT 1;
  IF NOT FOUND THEN RETURN NULL; END IF;

  SELECT monthly_price, annual_price INTO v_override_row
    FROM public.community_price_overrides
   WHERE community_id = p_community_id AND plan_code = p_plan_code AND is_active = true LIMIT 1;
  IF FOUND THEN
    v_base_monthly := v_override_row.monthly_price;
    v_base_annual  := COALESCE(v_override_row.annual_price, ROUND(v_override_row.monthly_price * 12 * 0.80, 2));
  END IF;

  IF p_interval = 'annual' THEN
    v_base := COALESCE(v_base_annual, ROUND(v_base_monthly * 12 * 0.80, 2));
  ELSE
    v_base := v_base_monthly;
  END IF;

  v_result := v_base;

  SELECT * INTO v_discount_row
    FROM public.user_discounts
   WHERE user_id = p_user_id AND is_active = true
     AND (plan_code IS NULL OR plan_code = p_plan_code)
     AND (billing_scope = 'both' OR billing_scope = p_interval)
     AND valid_from <= now()
     AND (valid_until IS NULL OR valid_until > now())
     AND (max_uses IS NULL OR used_count < max_uses)
   ORDER BY created_at DESC LIMIT 1;

  IF FOUND THEN
    IF v_discount_row.discount_type = 'pct' THEN
      v_result := ROUND(v_result * (1 - v_discount_row.discount_value / 100), 2);
    ELSE
      v_result := GREATEST(0, ROUND(v_result - v_discount_row.discount_value, 2));
    END IF;
  END IF;

  RETURN v_result;
END;
$$;


-- [025] Fix grants para admin_roles y audit_logs (PostgREST schema cache)
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_roles TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.audit_logs TO anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_roles' AND policyname='admin_roles_no_public_select') THEN
    CREATE POLICY admin_roles_no_public_select ON public.admin_roles FOR SELECT USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_roles' AND policyname='admin_roles_no_public_insert') THEN
    CREATE POLICY admin_roles_no_public_insert ON public.admin_roles FOR INSERT WITH CHECK (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_roles' AND policyname='admin_roles_no_public_update') THEN
    CREATE POLICY admin_roles_no_public_update ON public.admin_roles FOR UPDATE USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='admin_roles' AND policyname='admin_roles_no_public_delete') THEN
    CREATE POLICY admin_roles_no_public_delete ON public.admin_roles FOR DELETE USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' AND policyname='audit_logs_no_public_select') THEN
    CREATE POLICY audit_logs_no_public_select ON public.audit_logs FOR SELECT USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='audit_logs' AND policyname='audit_logs_insert_deny') THEN
    CREATE POLICY audit_logs_insert_deny ON public.audit_logs FOR INSERT WITH CHECK (false);
  END IF;
END $$;


-- ============================================================
-- BLOQUE 6: INVITES
-- ============================================================

-- [030] community_invites
CREATE TABLE IF NOT EXISTS public.community_invites (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  token         TEXT        UNIQUE NOT NULL,
  community_id  TEXT        NOT NULL REFERENCES public.communities(id) ON DELETE CASCADE,
  role          TEXT        NOT NULL DEFAULT 'member',
  sponsor_username TEXT     NULL,
  max_uses      INT         NOT NULL DEFAULT 0,
  uses          INT         NOT NULL DEFAULT 0,
  expires_at    TIMESTAMPTZ NULL,
  created_by    TEXT        NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.community_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invites_select_all"   ON public.community_invites FOR SELECT USING (true);
CREATE POLICY "invites_insert_admin" ON public.community_invites FOR INSERT WITH CHECK (true);
CREATE POLICY "invites_update_admin" ON public.community_invites FOR UPDATE USING (true);
CREATE POLICY "invites_delete_admin" ON public.community_invites FOR DELETE USING (true);

CREATE INDEX IF NOT EXISTS idx_community_invites_token ON public.community_invites(token);

INSERT INTO public.community_invites (token, community_id, role, sponsor_username, max_uses, created_by)
VALUES ('skalia-sensei', 'skalia-vip', 'member', 'sensei', 0, 'sensei')
ON CONFLICT (token) DO NOTHING;


-- [031] Invites v2 + permisos granulares + vista member_invites_view
ALTER TABLE public.community_invites ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_community_invites_active
  ON public.community_invites (community_id, is_active)
  WHERE is_active = true;

ALTER TABLE public.community_members ADD COLUMN IF NOT EXISTS can_create_communities BOOLEAN NOT NULL DEFAULT false;

UPDATE public.community_members SET can_create_communities = true WHERE role IN ('leader', 'owner');

ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS owner_username TEXT;

UPDATE public.communities c
SET owner_username = cm.username
FROM public.community_members cm
WHERE cm.community_id = c.id
  AND cm.role IN ('leader', 'owner')
  AND c.owner_username IS NULL;

CREATE INDEX IF NOT EXISTS idx_community_invites_sponsor
  ON public.community_invites (sponsor_username)
  WHERE sponsor_username IS NOT NULL;

CREATE OR REPLACE VIEW public.member_invites_view AS
SELECT
  ci.id,
  ci.token,
  ci.community_id,
  c.nombre AS community_name,
  c.slug AS community_slug,
  ci.sponsor_username,
  ci.role,
  ci.max_uses,
  ci.uses,
  ci.expires_at,
  ci.is_active,
  ci.created_at
FROM public.community_invites ci
JOIN public.communities c ON c.id = ci.community_id
WHERE ci.is_active = true;

UPDATE public.community_invites SET is_active = true WHERE token = 'skalia-sensei';
UPDATE public.communities SET slug = 'skalia-vip' WHERE id = 'skalia-vip' AND slug IS NULL;
UPDATE public.communities SET slug = 'general'    WHERE id = 'general'    AND slug IS NULL;


-- ============================================================
-- FINAL: Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';

SELECT '✅ Master migration completada!' AS resultado;
