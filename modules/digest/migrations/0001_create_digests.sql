-- The digest log (FR-12): one row per digest run that found the projects changed since the latest row. `snapshot`
-- is what the run compared against the latest row: per project its done items, release, open entries and broken
-- reasons. `baseline` is the first run (nothing to compare with), `quiet` a change with nothing to report,
-- `pending` a rendered mail being sent and `sent` that mail delivered to every recipient. A pending row keeps its
-- rendered mail, so a retry sends the same text; at most one row is pending.
-- Rollback: DROP SCHEMA digest CASCADE; then
--   DELETE FROM softure.migrations WHERE module = 'digest' AND version = 1;
CREATE TABLE digests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  status text NOT NULL CHECK (status IN ('baseline', 'quiet', 'pending', 'sent')),
  snapshot jsonb NOT NULL,
  subject text,
  body_text text,
  body_html text,
  created_at timestamptz NOT NULL,
  sent_at timestamptz,
  CHECK ((status IN ('pending', 'sent')) = (subject IS NOT NULL AND body_text IS NOT NULL AND body_html IS NOT NULL)),
  CHECK ((status = 'sent') = (sent_at IS NOT NULL))
);

CREATE UNIQUE INDEX digests_one_pending ON digests ((true)) WHERE status = 'pending';
