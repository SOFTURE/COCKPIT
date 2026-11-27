# Plan: bump-softure-packages-2026-11-27

## Approach
Install the two new versions, apply theme-notion 0.41.0's dialog migration, move every deploy pin to the
`deploy@0.7.10` commit, and run every gate plus the e2e.

## Key decisions
- The deploy guard (`tests/deploy/production-stack.test.ts`) maps the locked version to its tag commit, so the
  bumped lockfile turns it red until the pins and the map move.
- The dialog migration is proved by the scheduled e2e: the footer carries `data-sticky="true"` and the dialog is
  672 px wide from `md` (the theme's `form`), both false with `size="wide"`.
- The theme's `sideLayout`/`DatePicker` are not adopted (see `change.md`).

## Phase 1: Bump and adapt

- Files: `package.json`, `package-lock.json`, `src/scheduled/scheduled-task-dialog.tsx`, `e2e/scheduled.spec.ts`,
  `tests/deploy/production-stack.test.ts`, `.github/workflows/deploy.yml`, `.github/workflows/release.yml`,
  `docker/server/deploy.sh`, `docker/prod/hooks/lib.sh`, `docker/prod/docker-compose.yml`, `Dockerfile`.
- Mode: test-first (the deploy guard and the scheduled e2e red before the fix).
- Done when: the lockfile resolves both versions; typecheck, lint, test and e2e are green; the pull request's CI is
  green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bump and adapt

#### Automated
- [x] 1.1 Lockfile resolves theme-notion 0.41.1 and deploy 0.7.10 (equal to `npm view`)
- [x] 1.2 Deploy guard red on the bumped lockfile (1 failed, 22 passed), green with the pins on `ed3227c` (23/23)
- [x] 1.3 Scheduled e2e red with `size="wide"` (`data-sticky` missing, 1 failed), green with `size="form"` and `DialogFooter sticky` (8/8)
- [x] 1.4 Gates green: typecheck, lint (language scan), test 980/980
- [x] 1.5 e2e green after the bump (local `npm run build && npm run e2e`: 126 passed; the pull request's CI `e2e` job)
- [x] 1.6 The weekly-task e2e ran past the 30 s budget in CI's "e2e under load" (33.3 s; 26.9 s on master's
  a88e20d under load already): split into one test per width plus the rows test; locally 128/128 under
  `--workers=4` (4.6 s, 4.0 s, 1.5 s)
