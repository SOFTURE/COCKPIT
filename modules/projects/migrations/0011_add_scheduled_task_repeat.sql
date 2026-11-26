-- Repeating scheduled tasks (CT-39). A row stays one planned run; the runs of one repeating task share a series_id.
-- When a repeating run is claimed, the claim's transaction inserts the series' next run, so each run keeps what it
-- sent and lands in Done on its own. UNIQUE (series_id, run_at) is the run key that stops a second run of the same
-- planned time; the partial index keeps one upcoming run per series. A paused run does not fire.
-- Rollback: DROP INDEX projects.scheduled_tasks_series_upcoming; DROP INDEX projects.scheduled_tasks_series_run;
--   ALTER TABLE projects.scheduled_tasks DROP COLUMN series_id, DROP COLUMN paused, DROP COLUMN repeat; then
--   DELETE FROM softure.migrations WHERE module = 'projects' AND version = 11;
ALTER TABLE scheduled_tasks
  ADD COLUMN repeat text NOT NULL DEFAULT 'none' CHECK (repeat IN ('none', 'daily', 'weekly')),
  ADD COLUMN paused boolean NOT NULL DEFAULT false,
  ADD COLUMN series_id uuid;

UPDATE scheduled_tasks SET series_id = id;

ALTER TABLE scheduled_tasks
  ALTER COLUMN series_id SET NOT NULL,
  ADD CONSTRAINT scheduled_tasks_paused_is_scheduled CHECK (NOT paused OR status = 'scheduled');

CREATE UNIQUE INDEX scheduled_tasks_series_run ON scheduled_tasks (series_id, run_at);
CREATE UNIQUE INDEX scheduled_tasks_series_upcoming ON scheduled_tasks (series_id) WHERE status = 'scheduled';
