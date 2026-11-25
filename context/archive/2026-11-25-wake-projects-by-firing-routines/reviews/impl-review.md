# Implementation review: wake-projects-by-firing-routines

Reviewed: 2026-11-25, mode autonomous (`--auto`), against `plan.md`, `change.md` (with the owner's correction of
10:52) and the diff of the branch `claude/project-thread-2kdm7o`.

## Verdict
Approve. All five phases are done and verified; one bug was found and fixed by a test written during the review.

## Findings

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | Warning | A `sending` fire exactly `STALE_FIRE_MS` old was taken over by Retry (`>=`) but not by the drain (`<` in `findDueFires`); the drain test failed on the boundary. | Fixed: `findDueFires` uses `lte`, the same rule as Retry; `tests/routines/wake-issue.test.ts` covers it. |
| 2 | Suggestion | Routine management actions other than add do not re-check the watched list; they are scoped by `repository_key` in every `WHERE`, so a routine of another project is `not_found`. | Accepted as is (tested in `manage-routines.test.ts`). |
| 3 | Suggestion | The fire text is built from the repository name (`https://github.com/<owner>/<repo>/issues/<N>`), as `routines/cockpit-command.md` pins it, not from the forge's `html_url`. A forge other than GitHub would get a GitHub link. | Accepted: the owner's correction pins the GitHub form; COCKPIT reads only GitHub today. |
| 4 | Suggestion | No `@softure-ai/*` package encrypts a secret at rest, so `src/routines/token-box.ts` stays local. | Accepted; the gap is reported for SOFTURE/AI (this session's forge access is scoped to this repository). |

## Security
- The token goes from the form to `TokenBox.seal` only. `RoutineView` carries no ciphertext; logs carry the routine id
  and trigger id only (`wake-issue.test.ts` and `manage-routines.test.ts` assert no token in captured logs, stored
  rows or the tab's data; the e2e asserts the page HTML holds no token).
- Every server action calls `requireUser`; add also checks the project is watched.
- The trigger id is validated when stored and again before the call, so the path cannot be bent.

## Evidence
- `npm run lint`, `npx tsc --noEmit`: clean.
- `npx vitest run`: 94 files, 683 tests passed (after the merge of master).
- `npx playwright test` (all projects): 75 passed, including `e2e/routines.spec.ts` (routine added from a fire URL,
  Test answers HTTP 200, a broadcast to two projects fires each once with `COCKPIT command: https://github.com/...`,
  Retry recovers a 503).
- `npx softure-skills doctor`: OK.
- Production egress: from `ai-apps`, `POST https://api.anthropic.com/v1/claude_code/routines/<probe>/fire` answers 401
  (reachable; the compose networks are not internal).
