-- Rollback: (Claude Code routines only; delete the routines of other providers first)
--   ALTER TABLE projects.routines ADD COLUMN trigger_id text;
--   UPDATE projects.routines SET trigger_id = settings->>'triggerId';
--   ALTER TABLE projects.routines ALTER COLUMN trigger_id SET NOT NULL;
--   ALTER TABLE projects.routines ADD CONSTRAINT routines_trigger_id_check CHECK (trigger_id ~ '^[A-Za-z0-9_-]{1,100}$');
--   ALTER TABLE projects.routines DROP COLUMN settings, DROP COLUMN provider;
--   then DELETE FROM softure.migrations WHERE module = 'projects' AND version = 8;
-- Routines by provider (CT-20): a routine names the provider that calls it and keeps that provider's settings as one
-- JSON object, so a later provider needs no new column. Every routine stored so far is a Claude Code routine: its
-- `trigger_id` moves into `settings.triggerId` and its sealed token stays as it is (no new token). The provider is
-- checked here by its form and against the registered providers in code; the Claude Code settings keep the trigger id
-- pattern 0007 checked.
ALTER TABLE routines ADD COLUMN provider text NOT NULL DEFAULT 'claude-code'
  CONSTRAINT routines_provider_check CHECK (provider ~ '^[a-z][a-z0-9-]{0,39}$');
ALTER TABLE routines ALTER COLUMN provider DROP DEFAULT;

ALTER TABLE routines ADD COLUMN settings jsonb;
UPDATE routines SET settings = jsonb_build_object('triggerId', trigger_id);
ALTER TABLE routines ALTER COLUMN settings SET NOT NULL;
ALTER TABLE routines ADD CONSTRAINT routines_settings_object CHECK (jsonb_typeof(settings) = 'object');
ALTER TABLE routines ADD CONSTRAINT routines_claude_code_settings
  CHECK (provider <> 'claude-code' OR coalesce(settings->>'triggerId', '') ~ '^[A-Za-z0-9_-]{1,100}$');

ALTER TABLE routines DROP COLUMN trigger_id;
