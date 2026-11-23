-- Broadcasts (CV-1): one message from COCKPIT that becomes one owner-word issue in every chosen project. A broadcast
-- keeps its id from the form that sent it, so a resubmitted form is the same broadcast. Each chosen project gets one
-- send row, claimed ('creating') before the forge call; the unique index allows one send per broadcast and project,
-- so a resend or a retry finds the row instead of creating a second issue. A failed send keeps its reason until a
-- retry takes it over.
-- Rollback: DROP TABLE projects.broadcast_sends; DROP TABLE projects.broadcasts; then
--   DELETE FROM softure.migrations WHERE module = 'projects' AND version = 5;
CREATE TABLE broadcasts (
  id uuid PRIMARY KEY,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 10000),
  sent_by text NOT NULL,
  sent_by_name text CHECK (sent_by_name IS NULL OR sent_by_name <> ''),
  created_at timestamptz NOT NULL
);

CREATE TABLE broadcast_sends (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  broadcast_id uuid NOT NULL REFERENCES broadcasts (id) ON DELETE CASCADE,
  repository_key text NOT NULL,
  full_name text NOT NULL,
  status text NOT NULL CHECK (status IN ('creating', 'sent', 'failed')),
  failure text,
  issue_number integer,
  issue_url text,
  updated_at timestamptz NOT NULL,
  CHECK (status <> 'sent' OR (issue_number IS NOT NULL AND issue_url IS NOT NULL)),
  CHECK (status <> 'failed' OR failure IS NOT NULL)
);

CREATE UNIQUE INDEX broadcast_sends_one_per_project ON broadcast_sends (broadcast_id, repository_key);
