# Plan: header-refresh-own-e2e-server

## Approach
Give `e2e/header-refresh.spec.ts` its own server and database, the pattern `polish.spec.ts` and
`slow-repository-list.spec.ts` already use: a `refresh` project in `playwright.config.ts` with `testMatch` on the spec,
ignored by `chromium`, and a fourth `webServer` entry with `E2E_REFRESH_PORT` (3104) and `E2E_REFRESH_DATABASE_URL`
from `e2e/fixtures.ts`. Only this spec queues scans there, so its wait for an idle queue holds.

## Key decisions
- Isolate the spec rather than relax it: the idle end state ("Last read …", button enabled) is the behaviour CT-9
  promises and stays asserted.

## Phase 1: Isolate the spec
- Files: `playwright.config.ts`, `e2e/fixtures.ts`, `e2e/header-refresh.spec.ts`.
- Mode: test-after (test infrastructure).
- Done when: `--list` shows the spec under `refresh` only; the e2e green twice with `--workers=4`; gates green; the pull
  request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Isolate the spec

#### Automated
- [x] 1.1 `npx playwright test --list` shows both header-refresh tests under `[refresh]` only — see Summary
- [x] 1.2 `npm run e2e -- --workers=4` green twice in a row locally (70 passed, 70 passed) — see Summary
- [x] 1.3 Gates green: typecheck, lint (language scan) — see Summary
- [x] 1.4 Pull request CI green, all five `ci` jobs — see Summary

## Summary
Merged through the pull request of branch `claude/project-thread-v9mlm0`; merge SHA in the roadmap's history once it
lands (no roadmap item).
