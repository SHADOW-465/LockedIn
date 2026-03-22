ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS master_preference    text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS privacy_constraints  jsonb   DEFAULT '{"no_public_humiliation":false,"no_face_revealing":false,"no_outdoor_tasks":false,"no_involving_others":false}'::jsonb,
  ADD COLUMN IF NOT EXISTS session_intent       text    DEFAULT '',
  ADD COLUMN IF NOT EXISTS communication_style  jsonb   DEFAULT '{"feedback_frequency":"moderate","tone_preference":"balanced","punishment_sensitivity":"moderate"}'::jsonb,
  ADD COLUMN IF NOT EXISTS availability         jsonb   DEFAULT '{"active_hours":[],"timezone":""}'::jsonb,
  ADD COLUMN IF NOT EXISTS safeword             text    DEFAULT 'MERCY',
  ADD COLUMN IF NOT EXISTS psych_profile        text    DEFAULT '';
