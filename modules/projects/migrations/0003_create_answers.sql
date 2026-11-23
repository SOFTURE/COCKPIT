-- The owner's answers to owner-queue entries (FR-5, FR-6): who answered which entry text, how, and the owner-word
-- issue it became. An answer is claimed ('creating') before the forge call and marked 'sent' with its issue; the
-- unique index allows one answer per entry text, so a second answer of the same text (double click, two devices)
-- finds the first. Rows stay when the entry or the repository leaves: they are the answer history.
-- Rollback: DROP TABLE projects.answers; then
--   DELETE FROM softure.migrations WHERE module = 'projects' AND version = 3;
CREATE TABLE answers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  repository_key text NOT NULL,
  full_name text NOT NULL,
  entry_id text NOT NULL CHECK (entry_id <> ''),
  entry_text text NOT NULL,
  entry_kind text NOT NULL CHECK (entry_kind IN ('word', 'decision', 'step', 'secret')),
  entry_source text NOT NULL,
  entry_item text,
  answer text NOT NULL CHECK (answer IN ('yes', 'no', 'later')),
  note text CHECK (note IS NULL OR char_length(note) <= 2000),
  answered_by text NOT NULL,
  answered_at timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('creating', 'sent')),
  issue_number integer,
  issue_url text,
  CHECK (status <> 'sent' OR (issue_number IS NOT NULL AND issue_url IS NOT NULL))
);

CREATE UNIQUE INDEX answers_one_per_entry_text ON answers (repository_key, entry_id, md5(entry_text));
