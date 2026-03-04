CREATE TABLE IF NOT EXISTS session_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES profiles(id),
  event_type  text NOT NULL,
  payload     jsonb,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_session_events_session
  ON session_events(session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_session_events_user
  ON session_events(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS proof_documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id             uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id             uuid NOT NULL REFERENCES profiles(id),
  session_id          uuid REFERENCES sessions(id),
  file_type           text NOT NULL,
  local_storage_key   text,
  verification_status text NOT NULL DEFAULT 'pending',
  verified_at         timestamptz,
  created_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT file_type_check CHECK (file_type IN ('image', 'video', 'text', 'audio')),
  CONSTRAINT verification_status_check CHECK (verification_status IN ('pending', 'passed', 'failed'))
);

CREATE INDEX IF NOT EXISTS idx_proof_documents_task
  ON proof_documents(task_id);

CREATE INDEX IF NOT EXISTS idx_proof_documents_session
  ON proof_documents(session_id);
