# Plan: bump-softure-packages-2026-11-24-2

## Approach
Install jobs 0.1.15 and skills 0.36.0, re-run `npx softure-skills`, `state` and `doctor`, then adapt what turned red
or what the notes ask:

1. **skills 0.36.0.** CI's `context-doctor` pin moves to 0.36.0 (the guard test `tests/ci/context-doctor-pin.test.ts`
   turns red after the install).
2. **jobs 0.1.15.** No code change: the app calls `runScheduleNow` and never reads runs by dedup key. The e2e helper
   `e2e/scan-until-settled.ts` keeps its retry; its comment is brought up to the new behaviour.
3. **ownerWordWake.** `context/workflow.json` → `autonomy.ownerWordWake` goes from `"heartbeat"` to `"routine"`; the
   CV-2 owner step in `context/foundation/archive/2026-11-24-roadmap.md` is split: COCKPIT's part ticked done with the
   owner's word, the other watched repositories still open; `context/state.json` is regenerated.

## Key decisions
- Keep the Scan now retry in the e2e helper: it costs nothing when the first press settles and still guards a press
  that joined a pending run listed before the spec's repositories were added.
- `"routine"` only after the owner confirmed the task's GitHub trigger: a declared routine that does not fire would
  show the project as waking on its own.

## Phase 1: Bump and adapt

- Files: `package.json`, `package-lock.json`, `.claude/**`, `AGENTS.md` (managed block), `context/workflow.json`,
  `context/foundation/archive/2026-11-24-roadmap.md`, `context/state.json`, `.github/workflows/ci.yml`, `e2e/scan-until-settled.ts`.
- Mode: test-after for the pin (the existing guard test is the red check); no new behaviour in the app.
- Done when: the lockfile resolves the newest versions; the doctor exits 0; the pin test is red before and green
  after; gates and the e2e are green; the pull request's CI is green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Bump and adapt

#### Automated
- [x] 1.1 Lockfile resolves jobs 0.1.15 and skills 0.36.0 (equal to `npm view`); a second `npx softure-skills` is a no-op; `state` and `doctor` exit 0 with no cockpit-wake note
- [x] 1.2 CI `context-doctor` pin test red after the install (1 failed, 20 passed), green on 0.36.0
- [x] 1.3 Gates green: typecheck, lint (language scan), test 506/506
- [x] 1.4 e2e green after the bump: the pull request's CI `e2e` job (the container's Chromium does not match the pinned Playwright, so the local run cannot launch a browser)
