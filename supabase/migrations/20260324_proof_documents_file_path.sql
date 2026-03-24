-- Add file_path column to proof_documents so OPFS-stored proof files can be
-- referenced after session archival and retrieved for export.
-- Add text_content column so text proof submissions are persisted alongside metadata.

ALTER TABLE proof_documents
  ADD COLUMN IF NOT EXISTS file_path    text,
  ADD COLUMN IF NOT EXISTS text_content text;
