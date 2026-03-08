-- =============================================
-- Form Builder — Phase 2 additions
-- Abandon tracking + form_id on leads
-- =============================================

-- Add abandon tracking columns to form_submissions
ALTER TABLE form_submissions
    ADD COLUMN IF NOT EXISTS abandoned boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS last_question_id text,
    ADD COLUMN IF NOT EXISTS last_question_index integer;

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_form_submissions_abandoned
    ON form_submissions(form_id, abandoned);

-- Add form_id reference to leads (soft reference, no FK to allow cross-table flexibility)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS form_id text;
CREATE INDEX IF NOT EXISTS idx_leads_form_id ON leads(form_id);

-- Convenience view: form analytics summary
CREATE OR REPLACE VIEW form_analytics_summary AS
SELECT
    f.id                                            AS form_id,
    f.name,
    f.slug,
    f.status,
    f.views,
    f.starts,
    f.completions,
    COUNT(fs.id)                                    AS total_submissions,
    COUNT(fs.id) FILTER (WHERE fs.abandoned = true) AS total_abandoned,
    ROUND(
        CASE WHEN f.starts > 0
            THEN (f.completions::numeric / f.starts) * 100
            ELSE 0
        END, 1
    )                                               AS completion_rate_pct,
    f.updated_at
FROM forms f
LEFT JOIN form_submissions fs ON fs.form_id = f.id
GROUP BY f.id;

SELECT '✅ Form Builder Phase 2 SQL applied' AS resultado;
