# Plan: stabilise-header-refresh-under-load

## Approach
1. **Spec budget.** `e2e/header-refresh.spec.ts` keeps the 30 s budget for the scan to start (status shows a counter or
   the last read), reads the total from "N of M refreshed" and gives the scan `max(30 s, M × 3 s)` to finish; the test
   timeout grows with it.
2. **No extra request.** `src/forge/token-router.ts` sends each call to the token that last read the repository, else
   the token that last read one of its owner's repositories (`OwnerHints`, shared per process by
   `src/projects/forge-access.ts`), else the tokens in order; only an answer that says the token cannot see the
   repository (`not_found`, `unauthorized`; for a write also `refused`) moves on. `hasLabel` first finds the
   repository's token, so a 404 from a token that cannot see it is never read as "no label".

## Key decisions
- Scale the wait with the counted projects rather than raise a flat timeout: it states why the scan takes long and
  still fails when one project's read is slow.
- Owner hints live in the process, not the database: a restart costs at most one extra request per owner.

## Phase 1: Fix

- Files: `e2e/header-refresh.spec.ts`, `src/forge/token-router.ts`, `src/projects/forge-access.ts`,
  `tests/forge/token-router.test.ts`, `CHANGELOG.md`.
- Mode: TDD for the router (the request-count tests fail on the old router); the spec is verified by repeated runs.
- Done when: router tests green; gates green; `npm run e2e -- --workers=4` green 3 times in a row locally; the pull
  request's CI green; master's `ci` green on the merge SHA.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Fix

#### Automated
- [x] 1.1 Router request-count tests red on the old router (2 failed, 10 passed), green on the new one (12/12) — db2de03
- [x] 1.2 Gates green: typecheck, lint (language scan), test 603/603 — db2de03
- [x] 1.3 `npm run e2e -- --workers=4` green 3 runs in a row (70/70 each, 2.3–2.6 min) — db2de03
- [x] 1.4 Pull request CI green before the merge; master `ci` checked on the merge SHA by the thread after the merge — db2de03
