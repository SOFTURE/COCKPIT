# Plan: bump-softure-skills-0-41-2

## Approach
Install `@softure-ai/skills@^0.41.2`, regenerate `context/state.json`, run the doctor and the gates.

## Phase 1: Bump

- Files: `package.json`, `package-lock.json`, `.claude/softure-skills.json`,
  `.claude/skills/softure-doctor/scripts/context_state.py`, `.github/workflows/ci.yml` (the `context-doctor` pin),
  `context/state.json` (only if it changes).
- Mode: test-after.
- Done when: the lockfile resolves 0.41.2; `npx softure-skills doctor` is OK; typecheck, lint and test are green; the
  pull request's CI is green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bump

#### Automated
- [x] 1.1 Lockfile resolves `@softure-ai/skills` 0.41.2 (equal to `npm view`)
- [x] 1.2 `context_state.py write` leaves `context/state.json` unchanged; `owner_queue` unchanged (5 entries)
- [x] 1.3 `npx softure-skills doctor`: context/ contract OK
- [x] 1.4 CI doctor pin guard (`tests/ci/context-doctor-pin.test.ts`) red on the bumped lockfile (0.41.1 vs 0.41.2), green with `ci.yml` on 0.41.2
- [x] 1.5 Gates green: typecheck, lint, test 980/980
