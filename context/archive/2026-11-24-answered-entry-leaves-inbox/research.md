# Research: answered-entry-leaves-inbox

## How it works today
- `src/inbox/build-inbox.ts`: an entry whose text carries `(later: #N)` at its very end (`DEFERRAL_PATTERN`,
  anchored with `\s*$`) is `deferred`. Otherwise COCKPIT's own answer matches only by `entryId` and the exact
  `entryText`; with the same id and another text the row is `open` and `previousAnswer` names the earlier answer
  (the "changed since your answer" line in `inbox-row.tsx`).
- `src/forge/issues.ts` `getSettleSteps`: tells the project "later: leave it open with `(later: #<this issue>)`" and
  says nothing about not re-wording the entry.

## What happened in the watched project
- Later: the project ticked nothing and wrote `**OD-4** (later: #54, <a note>): …`; the mark is inside
  the text, so the anchored pattern missed it; the text differs from the answered one, so the row was `open` with
  a previous answer.
- Yes: the project appended `<state> 2026-11-24 (#57): …` to the entry and kept it open because owner-only steps were
  left; same result.

## Options
1. Read the settle-in-progress case: a new text that cites the answer's issue number keeps that answer (chosen).
2. Compare texts fuzzily: brittle and would also hide real re-wordings that need a new answer. Rejected.
3. Rely only on the projects following the new SKILLS rules: projects on older packages would keep re-raising
   entries until they bump. Rejected as the only fix; the footer change does that part.

## Files
`src/inbox/build-inbox.ts`, `src/forge/issues.ts`, `tests/inbox/build-inbox.test.ts`, `tests/forge/issues.test.ts`,
`CHANGELOG.md`. No migration, no UI copy change.
