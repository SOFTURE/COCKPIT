# Research: answer-becomes-cockpit-issue

Input: change.md, roadmap CMP-5, PRD FR-5, FR-6, FR-14 (reuse later), NFR-5, NFR-6, NFR-7; WORKFLOW §8.6 (the
cockpit marker); `@softure-ai/core` `requestJson` (write methods); the CMP-4 inbox. Depth: normal.
Snapshot: master 62d8cdb, 2026-11-23.

## Summary
The inbox (CMP-4) already reads every entry and marks it sent or done from the `cockpit` issues the scan stores.
This change adds the one write: a server action that, for a stored entry, checks that the repository has the
`cockpit` label, creates one issue whose body quotes the entry and carries the marker, and records the answer
(who, when, the entry text it answered, the issue) in a new table. A unique index on the project, the entry id and
the entry text makes a second answer of the same entry impossible, even from two devices at once.

## Current state
- `src/forge/client.ts`: reads only (`getRepository`, `probe`, `getJsonFile`, `listOwnerWordIssues`).
- `src/inbox/build-inbox.ts`: answer state from issue markers only; open, sent, done.
- `modules/projects`: tables `repositories` and `reads`; migrations 0001, 0002.
- `requestJson` takes `method: "POST"` with a JSON `body`; a 404 is an unexpected answer with status 404, 409/412 a
  conflict, 401/403 refused, 5xx unavailable, a timeout or network failure unreachable (status null).

## Findings
- **Forge calls:** `GET /repos/{o}/{r}/labels/cockpit` (200 exists, 404 missing; Metadata or Issues read) and
  `POST /repos/{o}/{r}/issues` with `{ title, body, labels: ["cockpit"] }` (Issues write). Both are inside the
  permissions NFR-5 lists.
- **Exactly one issue (FR-5):** a row is inserted first (`status = 'creating'`) under a unique index on
  `(repository_key, entry_id, md5(entry_text))`; the losing request finds the row and creates nothing. Only the
  winner calls the forge. When the forge refuses, the row is deleted and the owner sees why (FR-5 failure case).
- **Lost answers:** a POST that times out may still have created the issue. Before deleting the row, the action
  re-reads the cockpit issues and adopts one that carries this entry's marker and was created after the answer
  started; only when none is found is the answer dropped.
- **A crashed request** leaves a `creating` row; one older than 10 minutes is taken over by the next answer with a
  conditional update, so an entry never stays stuck.
- **Reworded entry (FR-6):** same id, new text. The answer row keeps the text it answered; the inbox treats the new
  text as unanswered and shows the old answer as "the entry changed since". Issues claimed by an answer row are not
  matched by marker again, so the old issue does not mark the new text as sent.
- **Outside COCKPIT (unknown in the roadmap):** a cockpit issue with the marker that no answer row claims counts
  as the answer (FR-6, "sent too"); CMP-4 already does this and stays.
- **History (FR-6):** an answer whose entry left the state stays listed under "Answered earlier" with its issue.
- **Who answered (FR-11 later):** the row stores the user id; the issue body names nobody in this item (CMP-17 adds
  attribution for teammates), so no personal data reaches a public repository.
- **Secrets (NFR-6):** the forge error never carries the token or the URL (`requestJson`); the owner sees a fixed
  message per failure kind.

## Unknowns answered
- *Does a cockpit issue created outside COCKPIT count?* Yes, as "sent" (and "done" when closed), unless an answer
  row already claims the entry's current text.

## Modules (SOFTURE first)
Adopted: core (`requestJson`, Result), db (migration in the projects module), auth (`requireUser`), theme-notion
(Button, Field, Textarea, Status). Built here: the answer rule (COCKPIT-specific). No gap.

## Risks
- NFR-7: the forge client gains exactly one write method; a test drives every client method against a fake fetch
  that records methods and fails on any write other than `POST .../issues`.
