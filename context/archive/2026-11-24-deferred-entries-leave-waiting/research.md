# Research: deferred-entries-leave-waiting

## How it works today
- `src/inbox/build-inbox.ts`: rows come from `getStoredEntries(source.state)` (the stored `owner_queue`). The answer
  state is COCKPIT's own recorded answer matched on entry id **and** text, else a cockpit issue marker no recorded
  answer claims. An entry whose text changed after an answer is `open` with `previousAnswer` (FR-6).
- `unansweredCount` and `countUnansweredByProject` count rows whose answer is `open`; the inbox page and the project
  page show every row and count all of them in the section title and the project tab.
- `src/forge/issues.ts`: the answer issue carries the entry, the answer, the note and the marker, and no word on what
  the project does next; the broadcast issue already ends with "Act on it … then close this issue".

## The watched project (fictional names in the repository)
- "later": source line re-worded with `(later: #892)`, `state.json` regenerated, issue closed. After the next scan
  COCKPIT shows the entry as open with "changed since your answer: Later · issue #892".
- "yes" that needs an owner-only step: issue stays open with a comment naming the step; COCKPIT shows "Sent". No
  machine-readable signal exists for "back to the owner" (SOFTURE/SKILLS issue filed).

## Options
1. Recognise `(later: #N)` in the entry text (the §8.6 shape) and give the row a `deferred` answer state; pages show
   deferred rows in their own group, outside the waiting count. Chosen: derived from the project's own context, no
   COCKPIT state.
2. Treat a closed "later" issue as settling the entry: wrong, §8.6 keeps it open on purpose.
3. A write-back over COCKPIT's MCP from the project: adds a second source of truth and a write path into COCKPIT for
   something the project's context already says. Rejected.
