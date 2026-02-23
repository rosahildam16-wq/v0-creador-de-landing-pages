-- Add username (unique) and sponsor_username to community_members
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE community_members ADD COLUMN IF NOT EXISTS sponsor_username TEXT;

-- Add owner_username to communities (links community to its leader)
ALTER TABLE communities ADD COLUMN IF NOT EXISTS owner_username TEXT;

-- Create index for fast username lookups
CREATE INDEX IF NOT EXISTS idx_cm_username ON community_members(username);
CREATE INDEX IF NOT EXISTS idx_cm_sponsor ON community_members(sponsor_username);
CREATE INDEX IF NOT EXISTS idx_comm_owner ON communities(owner_username);
