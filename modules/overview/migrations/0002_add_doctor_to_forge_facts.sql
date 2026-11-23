-- The doctor result of each watched project (FR-7, FR-8): the `context-doctor` check run on the head of its main
-- branch as the scan read it (`ok`, `failing` with its failure codes, `pending`, `missing`). Like the other facts,
-- a failed read keeps the last good value and `doctor_status` says why it is old; rows written before this
-- migration have not read the doctor yet (`unavailable`).
-- Rollback: ALTER TABLE overview.forge_facts DROP COLUMN doctor, DROP COLUMN doctor_status; then
--   DELETE FROM softure.migrations WHERE module = 'overview' AND version = 2;
ALTER TABLE forge_facts
  ADD COLUMN doctor jsonb,
  ADD COLUMN doctor_status text NOT NULL DEFAULT 'unavailable' CHECK (doctor_status IN ('ok', 'not_readable', 'unavailable'));
