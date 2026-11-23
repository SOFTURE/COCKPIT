-- Who gave each answer, as a name people read (FR-16): the answerer's display name or email at the time of the
-- answer. A snapshot, so the history still names a teammate after the owner removes their account. Existing answers
-- take the name of their account when it still exists; others stay without a name.
-- Rollback: ALTER TABLE projects.answers DROP COLUMN answered_by_name; then
--   DELETE FROM softure.migrations WHERE module = 'projects' AND version = 4;
ALTER TABLE answers ADD COLUMN answered_by_name text CHECK (answered_by_name IS NULL OR answered_by_name <> '');

UPDATE answers
SET answered_by_name = COALESCE(NULLIF(account.display_name, ''), account.email)
FROM auth.users AS account
WHERE account.id::text = answers.answered_by;
