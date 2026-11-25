# Plan: bump-softure-skills-0-41

## Approach
Install skills 0.41.1, re-run `npx softure-skills`, `state` and `doctor`, then adapt what the new version asks:

1. CI's `context-doctor` pin moves to 0.41.1 (the guard test `tests/ci/context-doctor-pin.test.ts` turns red after
   the install).
2. `autonomy.ownerWordWake` leaves `context/workflow.json`: WORKFLOW §2 no longer lists it (the routine's
   "Autonomy keys" rule). No app code reads it.

## Key decisions
- Skills only: the owner's word names that package.
- No app change: COCKPIT already writes `cockpit` issues and fires the project's routine after creating one.

## Phase 1: Bump and adapt

- Files: `package.json`, `package-lock.json`, `.claude/**`, `AGENTS.md` (managed block), `context/workflow.json`,
  `context/state.json`, `.github/workflows/ci.yml`.
- Mode: test-after for the pin (the existing guard test is the red check); no new behaviour in the app.
- Done when: the lockfile resolves 0.41.1; the doctor exits 0; the pin test is red before and green after; gates are
  green; the pull request's CI is green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bump and adapt

#### Automated
- [x] 1.1 Lockfile resolves skills 0.41.1 (equal to `npm view`); `state` and `doctor` exit 0
- [x] 1.2 CI `context-doctor` pin test red after the install (1 failed), green on 0.41.1
- [x] 1.3 `autonomy.ownerWordWake` removed; no code reads it (grep)
- [x] 1.4 Gates green: typecheck, lint (language scan), test 683/683
- [x] 1.5 e2e green after the bump: the pull request's CI `e2e` job
