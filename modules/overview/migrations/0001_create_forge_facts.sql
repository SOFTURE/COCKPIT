-- What the scan read from the forge about each watched project, beside its state (FR-7, FR-8): the latest release,
-- the last completed CI run and the last quality-review run on the main branch. One row per project; it leaves
-- with its repository. A fact that could not be read keeps its last good value; `runs_status` says why it is old.
-- Rollback: DROP SCHEMA overview CASCADE; then
--   DELETE FROM softure.migrations WHERE module = 'overview' AND version = 1;
CREATE TABLE forge_facts (
  repository_key text PRIMARY KEY REFERENCES projects.repositories (repository_key) ON DELETE CASCADE,
  release jsonb,
  release_status text NOT NULL CHECK (release_status IN ('ok', 'not_readable', 'unavailable')),
  ci_run jsonb,
  quality_review_run jsonb,
  runs_status text NOT NULL CHECK (runs_status IN ('ok', 'not_readable', 'unavailable')),
  read_at timestamptz NOT NULL
);
