# Plan review: scheduled-task-repeat

Reviewed against change.md, research.md and the code at master 23f62d7 (auto mode).

| # | Finding | Severity | Decision |
| --- | --- | --- | --- |
| 1 | A takeover of a stale `sending` row passes through the same claim; spawning on every claim would make two next occurrences. | Critical | Accepted: D2, spawn only on `scheduled → sending`, plus the partial unique index as a second line. |
| 2 | "Next after planned, not after now" alone would make a run missed by three weeks fire three more times on the next three ticks. | Critical | Accepted: D1, the first period point after both. |
| 3 | Run now that claims the repeating occurrence would skip the planned run and contradict "the row stays in Scheduled with the next time". | Warning | Accepted: D3, a copy. |
| 4 | A resumed weekly task whose time passed would fire at once although pause means "does not fire". | Warning | Accepted: D4. |
| 5 | `ScheduledRunDependencies` has no time zone; the worker and the action both need it for the next time. | Warning | Accepted: add `timeZone` (`config.timezone`) to the dependencies. |
| 6 | Radix `RadioGroup`'s own hidden input inside a hand-submitted form is not needed and may follow a form reset. | Suggestion | Accepted: D6, a hidden `repeat` input from state. |
| 7 | The spawned occurrence and its sending predecessor both show under Scheduled for the seconds a run takes. | Suggestion | Accepted as is: the sending row says "Sending" and has no menu; it moves to Done when recorded. |

Verdict: ready to implement.

## Decisions (auto)
- All seven findings accepted as recorded above.
