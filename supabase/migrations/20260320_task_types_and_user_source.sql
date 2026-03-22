-- Extend task_type and source CHECK constraints to include new values

-- Drop existing constraints
ALTER TABLE tasks
  DROP CONSTRAINT IF EXISTS task_type_check,
  DROP CONSTRAINT IF EXISTS source_check;

-- Re-add with expanded value sets
ALTER TABLE tasks
  ADD CONSTRAINT task_type_check CHECK (task_type IN ('daily', 'master', 'punishment', 'checkin', 'journal')),
  ADD CONSTRAINT source_check    CHECK (source    IN ('ai_chat', 'auto', 'system', 'user'));
