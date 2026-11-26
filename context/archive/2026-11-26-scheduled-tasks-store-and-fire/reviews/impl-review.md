# Implementation review: scheduled-tasks-store-and-fire

Reviewed the branch against plan.md and change.md (auto mode).

| # | Finding | Severity | Decision |
| --- | --- | --- | --- |
| 1 | A run that ends `retry_later` after its broadcast was fully sent (the task's own update failed) is resent by the takeover; every project send is `sent` by then, so the resend only records the task. | Suggestion | No change: covered by the broadcast's per-project sends; documented in `finishRun`. |
| 2 | `markScheduledTaskSent`/`Failed` match the claim time, so a worker whose run was taken over cannot overwrite the newer run's record. | Suggestion | Kept; tested in `tests/projects/scheduled-tasks.test.ts`. |
| 3 | The `messages.scheduled.failures` block has no reader yet. | Suggestion | Kept for CT-37, which shows a failed run's reason on the Done tab. |
| 4 | Two concurrent ticks on PGlite share one connection, so the test proves the status condition rather than the row lock; `FOR UPDATE SKIP LOCKED` covers separate Postgres connections in production. | Suggestion | Accepted as recorded in the plan review (finding 2). |

No drift from the plan: every rule of the roadmap item has a test (validation, DST days, grace, due/not due, late fire with
both times, concurrent ticks, stale takeover without a second issue, run now, edit of a sent task, delete keeping the
broadcast, unwatched project skipped, routines woken).

Verdict: ready to archive.

## Decisions (auto)
- No fixes needed; findings 1–4 recorded as above.
