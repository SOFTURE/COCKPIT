# Plan: answer-done-by-issue-number

## Approach
1. Migration 0012 adds `issue_closed_at timestamptz` to `projects.answers` (null until the scan sees the issue
   closed; only a `sent` answer may carry it).
2. `modules/projects/answers.ts`: `StoredAnswer.issueClosedAt`; `findAnswersAwaitingClosure(db, key)` lists the sent
   answers of a project with no closure; `recordAnswerIssueClosed(db, id, closedAt)` sets it once.
3. `src/forge/issue-state.ts`: `readIssueState(client, owner, name, number)` through `getJson`.
4. The scan, per project, after its reads: for every answer awaiting closure take the issue from the listed cockpit
   issues when it is there, otherwise read it by number; a rate limit pauses the scan as every other read does, any
   other failure leaves the answer as it is. Closed ones are recorded with the issue's `closed_at`.
5. `buildInbox`: an answer is done when `issueClosedAt` is set or its issue is in the listed closed issues; history
   rows of projects no longer watched use the stored closure too.

## Key decisions
- The closure is stored on the answer (the issue asked for it), so an unwatched project's history and every reader of
  `buildInbox` agree without extra forge calls.
- The labelled list stays the first source: no extra request for answers whose issue still carries `cockpit`.

## Phase 1: Closure stored and read
- Files: migration, schema, answers store, `src/forge/issue-state.ts`, scan, `build-inbox.ts`, tests, CHANGELOG.
- Mode: TDD (the build-inbox test of an unlabelled closed issue fails first).
- Done when: an answer whose issue is closed but not labelled is done after a scan, one whose issue is open stays
  `sent` (scan test); `buildInbox` reads the stored closure (unit test); gates and e2e green; PR CI all jobs green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Closure stored and read

#### Automated
- [x] 1.1 Failing test first: build-inbox with a stored closure, scan with an unlabelled closed issue — 84ad21f
- [x] 1.2 Migration, store, issue read, scan, build-inbox — 84ad21f
- [x] 1.3 Gates green: typecheck, lint, unit tests 984/984 — 84ad21f
- [x] 1.4 Full e2e green: the PR's `ci` job `e2e` (this container's Playwright has no matching browser) — 84ad21f
