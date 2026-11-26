-- Scheduled tasks (CT-36): a title, a prompt, the chosen projects and the instant the task sends itself as a
-- broadcast. A tick claims a due task by moving it from 'scheduled' to 'sending' and storing the run's broadcast id
-- before anything is sent, so two ticks never send it twice and a taken-over run resends the same broadcast (whose
-- per-project sends and marker stop a second issue). 'sent' keeps the planned and the sent time; 'failed' keeps why
-- nothing could be sent. broadcast_id has no foreign key: it exists before its broadcast, and a broadcast deleted
-- from history leaves the task's entry as it is.
-- Rollback: DROP TABLE projects.scheduled_tasks; then
--   DELETE FROM softure.migrations WHERE module = 'projects' AND version = 10;
CREATE TABLE scheduled_tasks (
  id uuid PRIMARY KEY,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  prompt text NOT NULL CHECK (char_length(prompt) BETWEEN 1 AND 10000),
  repository_keys text[] NOT NULL CHECK (cardinality(repository_keys) BETWEEN 1 AND 500),
  run_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('scheduled', 'sending', 'sent', 'failed')),
  broadcast_id uuid,
  claimed_at timestamptz,
  sent_at timestamptz,
  skipped_keys text[] NOT NULL DEFAULT '{}',
  failure text,
  created_by text NOT NULL,
  created_by_name text CHECK (created_by_name IS NULL OR created_by_name <> ''),
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK (status = 'scheduled' OR (broadcast_id IS NOT NULL AND claimed_at IS NOT NULL)),
  CHECK (status <> 'sent' OR sent_at IS NOT NULL),
  CHECK (status <> 'failed' OR failure IS NOT NULL)
);

CREATE INDEX scheduled_tasks_due ON scheduled_tasks (run_at) WHERE status IN ('scheduled', 'sending');
