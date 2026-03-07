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
