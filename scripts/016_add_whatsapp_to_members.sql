-- Add WhatsApp config columns to community_members
-- This allows members to configure their WhatsApp number for the Franquicia Reset funnel
-- and have it persisted server-side so visitors can load it from any browser.

ALTER TABLE community_members
  ADD COLUMN IF NOT EXISTS whatsapp_number TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_message TEXT;

-- Create index for fast username lookups (already exists but ensure)
CREATE INDEX IF NOT EXISTS idx_cm_username ON community_members(username);
