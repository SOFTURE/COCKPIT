# Plan: deferred-entries-leave-waiting

## Approach
1. `build-inbox.ts`: `parseDeferral(text)` reads `(later: #N)`; a row whose entry text carries it gets
   `{ kind: "deferred", issueNumber, issueUrl }` (URL from the stored issues, null when not stored), no
   `previousAnswer`. Deferred rows sort after the rest. `Inbox` gains `deferredCount`.
2. `inbox-row.tsx`: a deferred row shows a gray "Put off · issue #N" status and keeps its answer form.
3. Inbox page and project page: the waiting list and its count hold the rows that are not deferred; deferred rows go
   to a "Put off" section (inbox) or a "Put off" sub-list under Waiting for you (project page); the project tab counts
   only waiting rows.
4. `forge/issues.ts`: the answer issue ends with what the project does: settle the entry in its source (yes: carry it
   out and tick it `— done: #N`; no: `— declined: #N`; later: leave it open with `(later: #N)`), regenerate
   `context/state.json` in the same commit, comment and close the issue; COCKPIT drops the entry once the project's
   state no longer lists it.
5. Messages in `en.ts` and `pl.ts`; CHANGELOG.

## Key decisions
- Deferred rows stay in `inbox.rows` so the MCP `get_inbox`/`answer_entry` and the digest keep working; only the
  waiting views and counts leave them out (the counts already only count `open`).

## Phase 1: Deferred entries and the issue footer

- Files: `src/inbox/build-inbox.ts`, `src/inbox/inbox-row.tsx`, `app/(app)/inbox/page.tsx`,
  `src/project-page/project-page-sections.tsx`, `app/(app)/projects/[owner]/[name]/page.tsx`, `src/forge/issues.ts`,
  `src/mcp/answers.ts` (if the answer kind needs mapping), `messages/en.ts`, `messages/pl.ts`, tests, `CHANGELOG.md`.
- Mode: TDD for `buildInbox` and the issue text.
- Done when: unit tests for a deferred entry (with and without an earlier COCKPIT answer, with an unknown issue) and
  the issue footer pass; gates green; full e2e green locally; the pull request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Deferred entries and the issue footer

#### Automated
- [x] 1.1 New unit tests red before the change (5 failed: deferred state, deferredCount, issue footer) — 0eed1ad
- [x] 1.2 Unit tests green after the change (build-inbox 11/11, issues 13/13) — 0eed1ad
- [x] 1.3 Gates green: typecheck, lint (language scan), test 510/510 — 0eed1ad
- [x] 1.4 Full e2e green locally: 64/64 (`npm run build && npm run e2e`); the pull request's CI is the merge gate — 0eed1ad
