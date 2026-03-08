-- Fix: increment_social_views RPC had wrong column name 'visited_at'
-- The social_visits table uses 'created_at', not 'visited_at'.
-- The bad INSERT caused the entire function to fail (including the views_count UPDATE),
-- so no view counters were ever incremented and no visit records were created.

CREATE OR REPLACE FUNCTION increment_social_views(x_username text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Increment view counter
  UPDATE social_centers
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE username = x_username;

  -- Log the visit (column is 'created_at', not 'visited_at')
  INSERT INTO social_visits (username, created_at)
  VALUES (x_username, now());
EXCEPTION
  -- If social_visits doesn't exist yet, just ignore
  WHEN undefined_table THEN NULL;
  WHEN undefined_column THEN NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION increment_social_views(text) TO authenticated, anon;

-- Ensure social_centers grants are correct for the admin/service_role usage
-- (The API now uses createAdminClient which bypasses RLS, but keep these for safety)
GRANT SELECT, INSERT, UPDATE ON social_centers TO authenticated, anon;
GRANT SELECT, INSERT ON social_visits TO authenticated, anon;
