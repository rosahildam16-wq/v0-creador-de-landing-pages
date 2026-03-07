import { NextResponse } from "next/server"
import { Pool } from "pg"

function getPool(): Pool | null {
  const connectionString =
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.DATABASE_URL ||
    ""

  if (!connectionString) return null

  try {
    return new Pool({
      connectionString,
      max: 1,
      ssl: { rejectUnauthorized: false },
    })
  } catch {
    return null
  }
}

const FORMS_SQL = `
CREATE TABLE IF NOT EXISTS forms (
    id text PRIMARY KEY,
    owner_email text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    description text,
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published')),
    mode text NOT NULL DEFAULT 'conversational'
        CHECK (mode IN ('classic', 'conversational')),
    welcome_screen jsonb,
    end_screen jsonb,
    design jsonb,
    settings jsonb,
    views integer NOT NULL DEFAULT 0,
    starts integer NOT NULL DEFAULT 0,
    completions integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_owner ON forms(owner_email);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);

CREATE TABLE IF NOT EXISTS form_questions (
    id text PRIMARY KEY,
    form_id text NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    type text NOT NULL CHECK (type IN (
        'short_text','long_text','email','phone',
        'single_choice','multiple_choice','dropdown',
        'number','date','rating','visual_buttons'
    )),
    label text NOT NULL,
    description text,
    placeholder text,
    required boolean NOT NULL DEFAULT false,
    order_index integer NOT NULL DEFAULT 0,
    options jsonb,
    settings jsonb,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_questions_form ON form_questions(form_id, order_index);

CREATE TABLE IF NOT EXISTS form_logic_rules (
    id text PRIMARY KEY,
    form_id text NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    question_id text NOT NULL REFERENCES form_questions(id) ON DELETE CASCADE,
    condition_value text NOT NULL,
    action_type text NOT NULL CHECK (action_type IN ('jump_to', 'end_form')),
    target_question_id text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_logic_form ON form_logic_rules(form_id);

CREATE TABLE IF NOT EXISTS form_submissions (
    id text PRIMARY KEY,
    form_id text NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    lead_id text,
    submitted_at timestamptz NOT NULL DEFAULT now(),
    ip_address text,
    user_agent text,
    metadata jsonb
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_lead ON form_submissions(lead_id);

CREATE TABLE IF NOT EXISTS form_answers (
    id text PRIMARY KEY,
    submission_id text NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    form_id text NOT NULL,
    question_id text NOT NULL,
    question_label text,
    value text
);

CREATE INDEX IF NOT EXISTS idx_form_answers_submission ON form_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_form_answers_form ON form_answers(form_id);

-- member_integrations (Google, Zoom, WhatsApp tokens)
CREATE TABLE IF NOT EXISTS member_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT NOT NULL,
  provider TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expiry_date BIGINT,
  email TEXT,
  phone TEXT,
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(member_id, provider)
);

ALTER TABLE member_integrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'member_integrations' AND policyname = 'integrations_allow_all') THEN
    CREATE POLICY "integrations_allow_all" ON member_integrations FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_logic_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_answers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'forms' AND policyname = 'forms_all') THEN
    CREATE POLICY "forms_all" ON forms FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'form_questions' AND policyname = 'form_questions_all') THEN
    CREATE POLICY "form_questions_all" ON form_questions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'form_logic_rules' AND policyname = 'form_logic_rules_all') THEN
    CREATE POLICY "form_logic_rules_all" ON form_logic_rules FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'form_submissions' AND policyname = 'form_submissions_all') THEN
    CREATE POLICY "form_submissions_all" ON form_submissions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'form_answers' AND policyname = 'form_answers_all') THEN
    CREATE POLICY "form_answers_all" ON form_answers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forms_updated_at ON forms;
CREATE TRIGGER trg_forms_updated_at
    BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_forms_updated_at();

-- ===================================================
-- BOOKING MODULE (012 + 037)
-- ===================================================
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

-- 037 fix: add missing columns to booking_calendars
ALTER TABLE booking_calendars ADD COLUMN IF NOT EXISTS host_image_url text;
ALTER TABLE booking_calendars ADD COLUMN IF NOT EXISTS allow_cancellation boolean NOT NULL DEFAULT true;
ALTER TABLE booking_calendars ADD COLUMN IF NOT EXISTS allow_reschedule boolean NOT NULL DEFAULT false;

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

-- 037 fix: add missing columns to bookings
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS location_url text;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_details jsonb;

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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_calendars' AND policyname = 'booking_calendars_all') THEN
    CREATE POLICY "booking_calendars_all" ON booking_calendars FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'availability_rules' AND policyname = 'availability_rules_all') THEN
    CREATE POLICY "availability_rules_all" ON availability_rules FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'blackout_dates' AND policyname = 'blackout_dates_all') THEN
    CREATE POLICY "blackout_dates_all" ON blackout_dates FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_questions' AND policyname = 'booking_questions_all') THEN
    CREATE POLICY "booking_questions_all" ON booking_questions FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'bookings' AND policyname = 'bookings_all') THEN
    CREATE POLICY "bookings_all" ON bookings FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_rules' AND policyname = 'notification_rules_all') THEN
    CREATE POLICY "notification_rules_all" ON notification_rules FOR ALL USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'booking_audit_log' AND policyname = 'booking_audit_log_all') THEN
    CREATE POLICY "booking_audit_log_all" ON booking_audit_log FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ===================================================
-- SOCIAL CENTERS (012 + 036)
-- ===================================================
CREATE TABLE IF NOT EXISTS social_centers (
  username TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  tagline TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  theme_config JSONB DEFAULT '{"primary_color":"#8b5cf6","bg_style":"glass_mesh","layout":"list","button_style":"glass"}'::JSONB,
  links JSONB DEFAULT '[]'::JSONB,
  social_links JSONB DEFAULT '{}'::JSONB,
  views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 036 fix: add columns if missing
ALTER TABLE social_centers ADD COLUMN IF NOT EXISTS tagline text;
ALTER TABLE social_centers ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true;

ALTER TABLE social_centers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_centers' AND policyname = 'social_centers_select_all') THEN
    CREATE POLICY "social_centers_select_all" ON social_centers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'social_centers' AND policyname = 'social_centers_access_all') THEN
    CREATE POLICY "social_centers_access_all" ON social_centers FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION increment_social_views(x_username text)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE social_centers SET views_count = COALESCE(views_count, 0) + 1 WHERE username = x_username;
END;
$$;

-- Notify PostgREST to reload schema cache so new tables are available immediately
NOTIFY pgrst, 'reload schema';
`

export async function POST() {
  const pool = getPool()
  if (!pool) {
    return NextResponse.json(
      { error: "No database connection string found. Set POSTGRES_URL_NON_POOLING in your environment variables." },
      { status: 500 }
    )
  }

  const client = await pool.connect()
  try {
    await client.query(FORMS_SQL)
    return NextResponse.json({ success: true, message: "Forms tables created successfully." })
  } catch (err: any) {
    console.error("[migrate-forms] error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  } finally {
    client.release()
    await pool.end()
  }
}
