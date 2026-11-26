# Plan: row-arrow-level-with-controls

## Approach
1. `app/row-layout.css`: `[data-slot="list-entry-side"]:not(:has([data-row-wide])) { align-items: center; }`, so the
   arrow and the column share one middle; the comment names SOFTURE/AI#1520, dropped when the theme ships it.
2. `e2e/expect-list-entry-rows.ts`: for every row with an arrow and a column (no `data-row-wide`), the arrow's middle
   is within 1 px of the column's middle. Every row list's spec already calls it.
3. Screenshots before/after of Broadcast → Sent at 1280/390 light/dark, stored in the project's evidence store.

## Key decisions
- One rule in the row standard's stylesheet over a per-page class (owner's standard rule).
- The check in the shared row helper, so every list in the suite enforces it.

## Phase 1: Arrow level with the controls
- Files: `app/row-layout.css`, `e2e/expect-list-entry-rows.ts`, `CHANGELOG.md`.
- Mode: TDD: the check fails on the current build, passes after.
- Done when: red before, green after; gates green; full e2e green; screenshots looked at. PR CI (all jobs) is the merge
  gate.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Arrow level with the controls

#### Automated
- [x] 1.1 New check red on the current build (Broadcast → Sent: arrow 10.9 px off the column's middle), green with the stylesheet
- [x] 1.2 Gates green: typecheck, lint, test
- [x] 1.3 Full e2e green
- [x] 1.4 Screenshots before/after at 1280/390 light/dark checked and stored in the project files, `cockpit/evidence/row-arrow-level-with-controls/`
