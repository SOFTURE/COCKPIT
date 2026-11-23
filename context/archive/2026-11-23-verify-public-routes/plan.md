# Plan: verify-public-routes

## Approach
Replace the verify route `/` in `deploy.json` with `/unsubscribe` (a public page: it renders the app shell without a
session or token) and keep its `excludes: ["Application error"]`. A stack test fails when any verify route lies
outside `PUBLIC_PATHS`, so a guarded route cannot come back; a second test requires the rendered-page route. README's
Deploy section says what verify reads. CHANGELOG names the fix.

## Key decisions
- `/unsubscribe` over an OAuth discovery document: it is a rendered page, so the `Application error` check keeps its
  meaning; the discovery document is JSON from a route handler.
- No service token for the edge: it would not get past the app's own guard either, and adds a secret.

## Phase 1: Public verify routes

- Files: `deploy.json`, `tests/deploy/production-stack.test.ts`, `README.md`, `CHANGELOG.md`.
- Mode: TDD.
- Done when: both new tests fail on master and pass after; gates green; the pull request's CI (`deploy-dry-run`
  included) is green; after the merge the redeploy of the release tag passes verify.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Public verify routes

#### Automated
- [x] 1.1 Stack tests red on master (verify route `/` outside `PUBLIC_PATHS`, no `/unsubscribe` route): 2 failed, 12 passed — b92f124
- [x] 1.2 `deploy.json` verifies `/api/health` and `/unsubscribe`; stack tests green (14/14) — b92f124
- [x] 1.3 README and CHANGELOG name the verify routes — b92f124
- [x] 1.4 Gates green: typecheck, lint (language scan), test (321/321), doctor — b92f124
