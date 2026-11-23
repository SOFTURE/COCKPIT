-- What each optional adapter (FR-17) last read about a watched project: one row per project and adapter
-- (`observability` health, later `deploy` state). `value` when the source answered, `absent` when the project has
-- no such source (nothing shows), `unknown` with a reason code when the source failed (it shows as unknown; the
-- last value is not kept). Rows leave with their repository.
-- Rollback: DROP SCHEMA adapters CASCADE; then
--   DELETE FROM softure.migrations WHERE module = 'adapters' AND version = 1;
CREATE TABLE reads (
  repository_key text NOT NULL REFERENCES projects.repositories (repository_key) ON DELETE CASCADE,
  adapter text NOT NULL CHECK (adapter ~ '^[a-z][a-z0-9_]*$'),
  status text NOT NULL CHECK (status IN ('value', 'absent', 'unknown')),
  value jsonb,
  reason text,
  read_at timestamptz NOT NULL,
  PRIMARY KEY (repository_key, adapter),
  CHECK ((status = 'value') = (value IS NOT NULL)),
  CHECK ((status = 'unknown') = (reason IS NOT NULL))
);
