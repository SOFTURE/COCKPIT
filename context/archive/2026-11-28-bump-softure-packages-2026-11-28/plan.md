# Plan: bump-softure-packages-2026-11-28

## Approach
Install the two new versions and run every gate plus the e2e. Both releases are additive for this app.

## Phase 1: Bump

- Files: `package.json`, `package-lock.json`.
- Mode: test-after (no code changes, so no new test).
- Done when: the lockfile resolves both versions; typecheck, lint, test and e2e are green; the pull request's CI is
  green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bump

#### Automated
- [x] 1.1 Lockfile resolves mcp-access 0.7.10 and theme-notion 0.42.0 (equal to `npm view`)
- [x] 1.2 Gates green: typecheck, lint (language scan), test 984/984
- [x] 1.3 e2e green after the bump (local `npm run build && npm run e2e`: 129 passed; the pull request's CI `e2e` job)
- [x] 1.4 `npx softure-skills doctor`: context/ contract OK
