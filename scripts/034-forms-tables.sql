-- =============================================
-- Magic Funnel — Form Builder Tables
-- Quiz funnels, lead capture, qualification
-- =============================================

-- Main forms table
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
    welcome_screen jsonb,   -- { title, subtitle, button_label, image_url }
    end_screen jsonb,       -- { title, subtitle, redirect_url, show_booking, booking_calendar_slug }
    design jsonb,           -- { primary_color, bg_color, font, logo_url }
    settings jsonb,         -- { pipeline_stage, tag, score, notify_email }
    views integer NOT NULL DEFAULT 0,
    starts integer NOT NULL DEFAULT 0,
    completions integer NOT NULL DEFAULT 0,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_owner ON forms(owner_email);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);

-- Questions
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
    options jsonb,   -- [{ value, label, image_url? }]
    settings jsonb,  -- { crm_field, min, max, stars }
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_form_questions_form ON form_questions(form_id, order_index);

-- Conditional logic rules
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

-- Submissions (one per person per form fill)
CREATE TABLE IF NOT EXISTS form_submissions (
    id text PRIMARY KEY,
    form_id text NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    lead_id text,           -- FK to leads.id (created/matched on submit)
    submitted_at timestamptz NOT NULL DEFAULT now(),
    ip_address text,
    user_agent text,
    metadata jsonb          -- utm params, referrer, etc.
);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_lead ON form_submissions(lead_id);

-- Individual answers within a submission
CREATE TABLE IF NOT EXISTS form_answers (
    id text PRIMARY KEY,
    submission_id text NOT NULL REFERENCES form_submissions(id) ON DELETE CASCADE,
    form_id text NOT NULL,
    question_id text NOT NULL,
    question_label text,
    value text  -- all stored as text; JSON string for multiple_choice arrays
);

CREATE INDEX IF NOT EXISTS idx_form_answers_submission ON form_answers(submission_id);
CREATE INDEX IF NOT EXISTS idx_form_answers_form ON form_answers(form_id);

-- RLS: all via service_role / API routes handle auth themselves
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_logic_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forms_all" ON forms FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "form_questions_all" ON form_questions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "form_logic_rules_all" ON form_logic_rules FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "form_submissions_all" ON form_submissions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "form_answers_all" ON form_answers FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at on forms
CREATE OR REPLACE FUNCTION update_forms_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_forms_updated_at ON forms;
CREATE TRIGGER trg_forms_updated_at
    BEFORE UPDATE ON forms
    FOR EACH ROW EXECUTE FUNCTION update_forms_updated_at();

SELECT '✅ Form Builder tables created!' AS resultado;
