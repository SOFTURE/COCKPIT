-- A failed broadcast send names the configured token the forge refused, by its label (`FORGE_TOKEN`,
-- `FORGE_EXTRA_TOKENS[1]`, ...; never the token's text), so the owner can tell a routing bug from a missing
-- permission (#85). Null for failures no token explains and for sends that did not fail.
-- Rollback: ALTER TABLE projects.broadcast_sends DROP COLUMN failure_token; then
--   DELETE FROM softure.migrations WHERE module = 'projects' AND version = 6;
ALTER TABLE broadcast_sends ADD COLUMN failure_token text CHECK (failure_token IS NULL OR failure_token <> '');
