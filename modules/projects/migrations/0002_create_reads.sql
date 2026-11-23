-- The latest scan read of each watched project (FR-3): its status, the last good state and owner-word issues, and
-- when it was read. One row per project; it leaves with its repository.
-- Rollback: DROP TABLE projects.reads; then
--   DELETE FROM softure.migrations WHERE module = 'projects' AND version = 2;
CREATE TABLE reads (
  repository_key text PRIMARY KEY REFERENCES repositories (repository_key) ON DELETE CASCADE,
  status text NOT NULL CHECK (status IN ('ok', 'no_state', 'state_too_old', 'state_invalid', 'not_readable', 'unavailable')),
  issues_status text NOT NULL CHECK (issues_status IN ('ok', 'not_readable', 'unavailable')),
  state jsonb,
  issues jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(issues) = 'array'),
  read_at timestamptz NOT NULL,
  last_good_at timestamptz,
  CHECK (status <> 'ok' OR (state IS NOT NULL AND last_good_at IS NOT NULL))
);
