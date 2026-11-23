-- The repositories the owner watches (FR-2). The list lives only here, never in the repository's files.
-- Rollback: DROP TABLE projects.repositories; then
--   DELETE FROM softure.migrations WHERE module = 'projects' AND version = 1;
CREATE TABLE repositories (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  repository_key text NOT NULL UNIQUE CHECK (repository_key = lower(repository_key) AND repository_key LIKE '%/%'),
  full_name text NOT NULL CHECK (lower(full_name) = repository_key),
  default_branch text NOT NULL CHECK (char_length(default_branch) BETWEEN 1 AND 255),
  has_state boolean NOT NULL,
  missing_permissions text[] NOT NULL DEFAULT '{}',
  checked_at timestamptz NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now()
);
