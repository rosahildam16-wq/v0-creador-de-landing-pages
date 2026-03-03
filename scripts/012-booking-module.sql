-- =============================================
-- Booking Module - Complete Schema
-- Magic Funnel - Appointment Scheduling System
-- =============================================

-- 1. Calendarios de citas
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

-- 2. Reglas de disponibilidad
CREATE TABLE IF NOT EXISTS availability_rules (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time time NOT NULL,
    end_time time NOT NULL,
    active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- 3. Fechas bloqueadas
CREATE TABLE IF NOT EXISTS blackout_dates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    calendar_id uuid NOT NULL REFERENCES booking_calendars(id) ON DELETE CASCADE,
    date date NOT NULL,
    reason text,
    created_at timestamptz DEFAULT now()
);

-- 4. Preguntas del formulario
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

-- 5. Reservas (bookings)
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

-- 6. Reglas de notificaciones
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

-- 7. Audit log
CREATE TABLE IF NOT EXISTS booking_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id uuid REFERENCES bookings(id) ON DELETE CASCADE,
    event_type text NOT NULL,
    details jsonb,
    created_at timestamptz DEFAULT now()
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_calendars_owner ON booking_calendars(owner_email);
CREATE INDEX IF NOT EXISTS idx_calendars_slug ON booking_calendars(slug);
CREATE INDEX IF NOT EXISTS idx_availability_calendar ON availability_rules(calendar_id);
CREATE INDEX IF NOT EXISTS idx_blackout_calendar ON blackout_dates(calendar_id);
CREATE INDEX IF NOT EXISTS idx_bookings_calendar ON bookings(calendar_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_guest ON bookings(guest_email);
CREATE INDEX IF NOT EXISTS idx_bookings_time ON bookings(start_time);
CREATE INDEX IF NOT EXISTS idx_audit_booking ON booking_audit_log(booking_id);

-- Unique constraint to prevent double bookings (non-cancelled)
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_no_overlap
    ON bookings(calendar_id, start_time)
    WHERE status NOT IN ('cancelled', 'rescheduled');

-- RLS
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

SELECT '✅ Booking module tables created!' AS resultado;
