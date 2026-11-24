# Plan: bump-softure-packages-2026-11-24-3

## Approach
Install skills 0.37.0, re-run `npx softure-skills`, `state` and `doctor`, then adapt what turned red:

1. **skills 0.37.0.** CI's `context-doctor` pin moves to 0.37.0 (the guard test `tests/ci/context-doctor-pin.test.ts`
   turns red after the install).
2. **Later answers.** Search the owner queue, the roadmaps and the owner-word issues for entries answered `later`;
   move each to `roadmaps/roadmap-later.md` (WORKFLOW §8.6). None found, so nothing moves.

## Key decisions
- No app change: COCKPIT still reads `(later: #N)` entries of watched projects that have not upgraded yet as deferred,
  and an entry that left the queue is simply absent, which the inbox already handles.

## Phase 1: Bump and adapt

- Files: `package.json`, `package-lock.json`, `.claude/**`, `AGENTS.md` (managed block), `context/state.json`,
  `.github/workflows/ci.yml`.
- Mode: test-after for the pin (the existing guard test is the red check); no new behaviour in the app.
- Done when: the lockfile resolves the newest versions; the doctor exits 0; the pin test is red before and green
  after; gates and the e2e are green; the pull request's CI is green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bump and adapt

#### Automated
- [x] 1.1 Lockfile resolves skills 0.37.0 (equal to `npm view`); every other `@softure-ai/*` package equals `npm view`; `state` and `doctor` exit 0 with no `owner-entry-put-off` note
- [x] 1.2 CI `context-doctor` pin test red after the install (1 failed), green on 0.37.0
- [x] 1.3 Gates green: typecheck, lint (language scan), test 609/609
- [x] 1.4 No entry answered `later` to move: owner queue, roadmaps and owner-word issues searched
- [x] 1.5 e2e green after the bump: the pull request's CI `e2e` job
