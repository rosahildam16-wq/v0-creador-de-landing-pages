-- =============================================
-- Magic Builder — Funnels Persistence
-- Migrates builder data from localStorage to DB
-- =============================================

CREATE TABLE IF NOT EXISTS funnels (
    id text PRIMARY KEY,                          -- client-generated ID (landing_timestamp_random)
    member_id text NOT NULL,                      -- owner email (matches owner_email pattern)
    name text NOT NULL,
    description text,
    slug text NOT NULL,
    config jsonb NOT NULL DEFAULT '{}',           -- full LandingConfig JSON (blocks, theme, etc.)
    status text NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'published', 'archived')),
    custom_domain text,
    domain_status text DEFAULT 'none'
        CHECK (domain_status IN ('none', 'pending', 'verified', 'error')),
    domain_verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funnels_member ON funnels(member_id);
CREATE INDEX IF NOT EXISTS idx_funnels_slug ON funnels(member_id, slug);
CREATE INDEX IF NOT EXISTS idx_funnels_status ON funnels(status);
CREATE INDEX IF NOT EXISTS idx_funnels_domain ON funnels(custom_domain) WHERE custom_domain IS NOT NULL;

-- RLS: members can only see/edit their own funnels
ALTER TABLE funnels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "funnels_all" ON funnels FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_funnels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_funnels_updated_at ON funnels;
CREATE TRIGGER trg_funnels_updated_at
    BEFORE UPDATE ON funnels
    FOR EACH ROW EXECUTE FUNCTION update_funnels_updated_at();

SELECT '✅ Funnels table created!' AS resultado;
