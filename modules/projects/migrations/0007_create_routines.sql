-- Routines (CT-10): each watched project's Claude Code routines that COCKPIT fires right after it opens a cockpit
-- issue there. A routine keeps its token encrypted (AES-256-GCM under ROUTINE_TOKEN_SECRET) and only its last four
-- characters in the clear; the token's text is never stored. `kind` stays open for more kinds than cockpit-issues.
-- `routine_fires` records one fire per issue and routine, or one `no_routine` row for an issue its project had no
-- enabled routine for; the unique index (nulls not distinct) lets one claim win however many requests fire at once.
-- A fire row keeps the routine's id and name without a foreign key, so deleting a routine keeps the history.
-- `fire_log` holds every call made (fires and tests) for the hourly limits: 30 per routine and 100 in all.
-- Rollback: DROP TABLE projects.fire_log; DROP TABLE projects.routine_fires; DROP TABLE projects.routines; then
--   DELETE FROM softure.migrations WHERE module = 'projects' AND version = 7;
CREATE TABLE routines (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  repository_key text NOT NULL CHECK (repository_key <> ''),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  kind text NOT NULL CHECK (kind ~ '^[a-z][a-z0-9-]{0,39}$'),
  trigger_id text NOT NULL CHECK (trigger_id ~ '^[A-Za-z0-9_-]{1,100}$'),
  token_ciphertext text NOT NULL CHECK (token_ciphertext LIKE 'v1.%'),
  token_last4 text NOT NULL CHECK (char_length(token_last4) BETWEEN 1 AND 4),
  enabled boolean NOT NULL,
  last_fire_ok boolean,
  last_fire_status integer,
  last_fire_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK ((last_fire_ok IS NULL) = (last_fire_at IS NULL))
);

CREATE INDEX routines_by_repository ON routines (repository_key);

CREATE TABLE routine_fires (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  repository_key text NOT NULL,
  full_name text NOT NULL,
  issue_number integer NOT NULL CHECK (issue_number > 0),
  issue_url text NOT NULL,
  issue_title text NOT NULL,
  routine_id bigint,
  routine_name text,
  status text NOT NULL CHECK (status IN ('sending', 'sent', 'failed', 'queued', 'no_routine')),
  http_status integer,
  reason text CHECK (reason IS NULL OR reason ~ '^[a-z_]{1,40}$'),
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL,
  CHECK ((status = 'no_routine') = (routine_id IS NULL)),
  CHECK (status <> 'queued' OR next_attempt_at IS NOT NULL),
  CHECK (status <> 'failed' OR reason IS NOT NULL)
);

CREATE UNIQUE INDEX routine_fires_one_per_issue_and_routine
  ON routine_fires (repository_key, issue_number, routine_id) NULLS NOT DISTINCT;
CREATE INDEX routine_fires_due ON routine_fires (next_attempt_at) WHERE status = 'queued';

CREATE TABLE fire_log (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  routine_id bigint NOT NULL,
  fired_at timestamptz NOT NULL
);

CREATE INDEX fire_log_by_time ON fire_log (fired_at);
