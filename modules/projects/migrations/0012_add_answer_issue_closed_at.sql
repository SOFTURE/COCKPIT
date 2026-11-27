-- When the scan saw an answer's own issue closed (#166). The scan reads the issue by its number, whatever labels it
-- carries, so an answer is done once its issue is closed even when the issue lost the cockpit label or was created
-- under an older one. Null until then; only a sent answer has an issue to close. Existing answers start null and the
-- next scan fills the closed ones.
-- Rollback: ALTER TABLE projects.answers DROP COLUMN issue_closed_at; then
--   DELETE FROM softure.migrations WHERE module = 'projects' AND version = 12;
ALTER TABLE answers
  ADD COLUMN issue_closed_at timestamptz,
  ADD CONSTRAINT answers_issue_closed_only_when_sent CHECK (issue_closed_at IS NULL OR status = 'sent');
