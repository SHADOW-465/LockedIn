-- Extend sessions table
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS total_duration_minutes integer NOT NULL DEFAULT 10080,
  ADD COLUMN IF NOT EXISTS session_config         jsonb,
  ADD COLUMN IF NOT EXISTS extension_count        integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_extended_at       timestamptz;

-- Backfill total_duration_minutes from existing scheduled_end_time
UPDATE sessions
SET total_duration_minutes = EXTRACT(EPOCH FROM (scheduled_end_time - start_time)) / 60
WHERE scheduled_end_time IS NOT NULL AND start_time IS NOT NULL;

-- Extend tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS task_type text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS source    text NOT NULL DEFAULT 'auto';

-- Constrain values
ALTER TABLE tasks
  ADD CONSTRAINT task_type_check CHECK (task_type IN ('daily', 'master', 'punishment')),
  ADD CONSTRAINT source_check    CHECK (source    IN ('ai_chat', 'auto', 'system'));
