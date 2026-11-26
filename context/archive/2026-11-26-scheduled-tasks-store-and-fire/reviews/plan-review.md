# Plan review: scheduled-tasks-store-and-fire

Reviewed against change.md, research.md and the code at master ade2f22 (auto mode).

| # | Finding | Severity | Decision |
| --- | --- | --- | --- |
| 1 | A task taken over at exactly `STALE_SEND_MS` can meet a project send still "in progress" and be marked sent while that send stays `creating`. | Warning | Accepted: D3, the run's stale time is `STALE_SEND_MS` + 1 min. |
| 2 | "Two concurrent ticks" on PGlite run on one connection, so `SKIP LOCKED` alone is not exercised; the test must prove the status condition too. | Suggestion | Accepted: the test runs two drains with `Promise.all` and a second drain after the first, and asserts one issue per project and one broadcast. |
| 3 | All projects unwatched at fire time would make `sendBroadcast` refuse with `no_projects` and the run retry forever. | Warning | Accepted: D5, the run becomes `failed` with its reason. |
| 4 | The roadmap names `tests/modules/**`, which does not exist; module tests live under `tests/projects/`. | Suggestion | Accepted: `tests/projects/scheduled-tasks.test.ts`. |

Verdict: ready to implement.

## Decisions (auto)
- All four findings accepted as recorded above.
