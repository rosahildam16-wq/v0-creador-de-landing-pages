"use client"

import { useState } from "react"
import { CheckCircle2, Copy, Database, RefreshCw, AlertCircle, ExternalLink } from "lucide-react"

const SETUP_SQL = `-- =============================================
-- Magic Funnel - Master Migration
-- Run this ONCE in Supabase SQL Editor
-- =============================================

-- FORMS
CREATE TABLE IF NOT EXISTS forms (
    id text PRIMARY KEY, owner_email text NOT NULL, name text NOT NULL,
    slug text NOT NULL, description text,
    status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
    mode text NOT NULL DEFAULT 'conversational' CHECK (mode IN ('classic','conversational')),
    welcome_screen jsonb, end_screen jsonb, design jsonb, settings jsonb,
    views integer NOT NULL DEFAULT 0, starts integer NOT NULL DEFAULT 0,
    completions integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_owner ON forms(owner_email);
CREATE TABLE IF NOT EXISTS form_questions (
    id text PRIMARY KEY, form_id text NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN ('short_text','long_text','email','phone','single_choice','multiple_choice','dropdown','number','date','rating','visual_buttons')),
    label text NOT NULL, description text, placeholder text,
    required boolean NOT NULL DEFAULT false, order_index integer NOT NULL DEFAULT 0,
    options jsonb, settings jsonb, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS form_logic_rules (
    id text PRIMARY KEY, form_id text NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    question_id text NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
    condition_value text NOT NULL, action_type text NOT NULL CHECK (action_type IN ('jump_to','end_form')),
    target_question_id text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS form_submissions (
    id text PRIMARY KEY, form_id text NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    lead_id text, submitted_at timestamptz NOT NULL DEFAULT now(),
    ip_address text, user_agent text, metadata jsonb
);
CREATE TABLE IF NOT EXISTS form_answers (
    id text PRIMARY KEY, submission_id text NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    form_id text NOT NULL, question_id text NOT NULL, question_label text, value text
);
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_logic_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_answers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='forms' AND policyname='forms_all') THEN CREATE POLICY "forms_all" ON forms FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='form_questions' AND policyname='form_questions_all') THEN CREATE POLICY "form_questions_all" ON form_questions FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='form_logic_rules' AND policyname='form_logic_rules_all') THEN CREATE POLICY "form_logic_rules_all" ON form_logic_rules FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='form_submissions' AND policyname='form_submissions_all') THEN CREATE POLICY "form_submissions_all" ON form_submissions FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='form_answers' AND policyname='form_answers_all') THEN CREATE POLICY "form_answers_all" ON form_answers FOR ALL USING (true) WITH CHECK (true); END IF;
END $$;

-- MEMBER INTEGRATIONS
CREATE TABLE IF NOT EXISTS member_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), member_id TEXT NOT NULL, provider TEXT NOT NULL,
  access_token TEXT, refresh_token TEXT, expiry_date BIGINT, email TEXT, phone TEXT,
  settings JSONB DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, provider)
);
ALTER TABLE member_integrations ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='member_integrations' AND policyname='integrations_allow_all') THEN CREATE POLICY "integrations_allow_all" ON member_integrations FOR ALL USING (true) WITH CHECK (true); END IF; END $$;

-- BOOKING MODULE
CREATE TABLE IF NOT EXISTS booking_calendars (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(), owner_email text NOT NULL,
    slug text UNIQUE NOT NULL, name text NOT NULL, description text,
    type text DEFAULT '1:1' CHECK (type IN ('1:1','group')), duration_minutes integer DEFAULT 30,
    timezone text DEFAULT 'America/Mexico_City', location_type text DEFAULT 'google_meet',
    location_value text, max_bookings_per_day integer DEFAULT 8, min_notice_hours integer DEFAULT 2,
    buffer_before_minutes integer DEFAULT 0, buffer_after_minutes integer DEFAULT 10,
    max_group_size integer DEFAULT 1,
    confirmation_message text DEFAULT 'Tu cita ha sido agendada exitosamente. Te esperamos!',
    confirmation_cta_url text, confirmation_cta_label text, active boolean DEFAULT true,
    host_image_url text, allow_cancellation boolean NOT NULL DEFAULT true,
    allow_reschedule boolean NOT NULL DEFAULT false,
    created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE booking_calendars ADD COLUMN IF NOT EXISTS host_image_url text;
ALTER TABLE booking_calendars ADD COLUMN IF NOT EXISTS allow_cancellation boolean NOT NULL DEFAULT true;
ALTER TABLE booking_calendars ADD COLUMN IF NOT EXISTS allow_reschedule boolean NOT NULL DEFAULT false;
CREATE TABLE IF NOT EXISTS availability_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time time NOT NULL, end_time time NOT NULL, active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS blackout_dates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
    date date NOT NULL, reason text, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS booking_questions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
    label text NOT NULL, type text DEFAULT 'text' CHECK (type IN ('text','email','phone','select','textarea')),
    placeholder text, required boolean DEFAULT true, options jsonb, sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS bookings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
    start_time timestamptz NOT NULL, end_time timestamptz NOT NULL,
    status text DEFAULT 'confirmed' CHECK (status IN ('confirmed','cancelled','rescheduled','no_show','completed')),
    guest_name text NOT NULL, guest_email text NOT NULL, guest_phone text,
    guest_answers jsonb DEFAULT '{}',
    cancel_token text UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
    reschedule_token text UNIQUE DEFAULT encode(gen_random_bytes(24),'hex'),
    cancelled_at timestamptz, cancel_reason text, rescheduled_from uuid REFERENCES bookings(id),
    notes text, location_url text, meeting_details jsonb,
    created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS location_url text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_details jsonb;
CREATE TABLE IF NOT EXISTS notification_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
    event_type text NOT NULL CHECK (event_type IN ('confirmation','reminder','cancellation','reschedule')),
    channel text DEFAULT 'email' CHECK (channel IN ('email','whatsapp')),
    timing_minutes integer DEFAULT 0, template text, active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS booking_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    event_type text NOT NULL, details jsonb, created_at timestamptz DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_no_overlap ON bookings(calendar_id, start_time) WHERE status NOT IN ('cancelled','rescheduled');
ALTER TABLE booking_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE blackout_dates ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_audit_log ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='booking_calendars' AND policyname='booking_calendars_all') THEN CREATE POLICY "booking_calendars_all" ON booking_calendars FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='availability_rules' AND policyname='availability_rules_all') THEN CREATE POLICY "availability_rules_all" ON availability_rules FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='blackout_dates' AND policyname='blackout_dates_all') THEN CREATE POLICY "blackout_dates_all" ON blackout_dates FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='booking_questions' AND policyname='booking_questions_all') THEN CREATE POLICY "booking_questions_all" ON booking_questions FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='bookings' AND policyname='bookings_all') THEN CREATE POLICY "bookings_all" ON bookings FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notification_rules' AND policyname='notification_rules_all') THEN CREATE POLICY "notification_rules_all" ON notification_rules FOR ALL USING (true) WITH CHECK (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='booking_audit_log' AND policyname='booking_audit_log_all') THEN CREATE POLICY "booking_audit_log_all" ON booking_audit_log FOR ALL USING (true) WITH CHECK (true); END IF;
END $$;

-- SOCIAL CENTERS
CREATE TABLE IF NOT EXISTS social_centers (
  username TEXT PRIMARY KEY, display_name TEXT NOT NULL, bio TEXT, avatar_url TEXT,
  tagline TEXT, is_published BOOLEAN NOT NULL DEFAULT true,
  theme_config JSONB DEFAULT '{"primary_color":"#8b5cf6","bg_style":"glass_mesh","layout":"list","button_style":"glass"}'::JSONB,
  links JSONB DEFAULT '[]'::JSONB, social_links JSONB DEFAULT '{}'::JSONB,
  views_count INT DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now(), updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE social_centers ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE social_centers ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;
ALTER TABLE social_centers ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='social_centers' AND policyname='social_centers_select_all') THEN CREATE POLICY "social_centers_select_all" ON social_centers FOR SELECT USING (true); END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='social_centers' AND policyname='social_centers_access_all') THEN CREATE POLICY "social_centers_access_all" ON social_centers FOR ALL USING (true) WITH CHECK (true); END IF;
END $$;
CREATE OR REPLACE FUNCTION increment_social_views(x_username text) RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN UPDATE social_centers SET views_count = COALESCE(views_count, 0) + 1 WHERE username = x_username; END; $$;
GRANT EXECUTE ON FUNCTION increment_social_views(text) TO authenticated, anon;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';`

export default function AdminSetupPage() {
    const [copied, setCopied] = useState(false)
    const [migrating, setMigrating] = useState(false)
    const [migrateResult, setMigrateResult] = useState<{ ok: boolean; msg: string } | null>(null)

    const handleCopy = () => {
        navigator.clipboard.writeText(SETUP_SQL)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleMigrate = async () => {
        setMigrating(true)
        setMigrateResult(null)
        try {
            const res = await fetch("/api/admin/migrate-forms", { method: "POST" })
            const data = await res.json()
            if (res.ok) {
                setMigrateResult({ ok: true, msg: "✅ Migración completada. Todas las tablas están listas." })
            } else {
                setMigrateResult({ ok: false, msg: data.error || "Error desconocido" })
            }
        } catch {
            setMigrateResult({ ok: false, msg: "Error de red al llamar el endpoint de migración." })
        } finally {
            setMigrating(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-8 space-y-8">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-3">
                    <Database className="h-6 w-6 text-primary" />
                    Setup de Base de Datos
                </h1>
                <p className="text-muted-foreground mt-1 text-sm">
                    Crea todas las tablas necesarias en Supabase para que la app funcione correctamente.
                </p>
            </div>

            {/* Option A: Auto-migration */}
            <div className="rounded-2xl border border-border/40 bg-card/40 p-6 space-y-4">
                <h2 className="font-bold text-lg">Opción A — Migración automática</h2>
                <p className="text-sm text-muted-foreground">
                    Requiere que <code className="text-primary bg-primary/10 px-1 rounded">POSTGRES_URL_NON_POOLING</code> esté configurada en Vercel.
                    La encuentras en: <strong>Supabase Dashboard → Settings → Database → Connection string → Direct</strong>.
                </p>
                <a
                    href="https://supabase.com/dashboard/project/_/settings/database"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                    <ExternalLink className="h-3 w-3" />
                    Ir a Supabase Database Settings
                </a>
                <button
                    onClick={handleMigrate}
                    disabled={migrating}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                    {migrating ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Database className="h-4 w-4" />}
                    {migrating ? "Ejecutando migración..." : "Ejecutar migración automática"}
                </button>
                {migrateResult && (
                    <div className={`flex items-start gap-2 rounded-xl p-3 text-sm ${migrateResult.ok ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                        {migrateResult.ok ? <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" /> : <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />}
                        {migrateResult.msg}
                    </div>
                )}
            </div>

            {/* Option B: Manual SQL */}
            <div className="rounded-2xl border border-border/40 bg-card/40 p-6 space-y-4">
                <h2 className="font-bold text-lg">Opción B — SQL manual en Supabase (recomendado)</h2>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-4">
                    <li>Ve a <strong>Supabase Dashboard → SQL Editor</strong></li>
                    <li>Crea un nuevo query</li>
                    <li>Copia el SQL de abajo y pégalo</li>
                    <li>Haz clic en <strong>Run</strong></li>
                </ol>
                <a
                    href="https://supabase.com/dashboard/project/_/sql/new"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                    <ExternalLink className="h-3 w-3" />
                    Abrir Supabase SQL Editor
                </a>
                <div className="relative">
                    <pre className="text-[10px] bg-black/40 border border-border/30 rounded-xl p-4 overflow-auto max-h-64 text-muted-foreground leading-relaxed">
                        {SETUP_SQL}
                    </pre>
                    <button
                        onClick={handleCopy}
                        className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
                    >
                        {copied ? <CheckCircle2 className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        {copied ? "Copiado!" : "Copiar SQL"}
                    </button>
                </div>
            </div>
        </div>
    )
}
