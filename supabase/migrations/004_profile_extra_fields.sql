-- Add Phase 3a profile fields: WhatsApp, session duration preference, learning goals

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS whatsapp TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS session_duration_pref INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS learning_goals JSONB DEFAULT '{}'::jsonb;

-- Validate session_duration_pref values
ALTER TABLE profiles
  ADD CONSTRAINT valid_session_duration CHECK (session_duration_pref IN (30, 60, 120));
