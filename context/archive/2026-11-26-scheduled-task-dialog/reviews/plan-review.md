# Plan review: scheduled-task-dialog

Reviewed against change.md, research.md and the code at master 35ec138 (auto mode).

| # | Finding | Severity | Decision |
| --- | --- | --- | --- |
| 1 | `createScheduledTask` ignores a repeated id (`onConflictDoNothing`); one id per page view would make a second "New task" report saved and create nothing. | Critical | Accepted: D4, a fresh id per opening, taken in the click handler (not during render). |
| 2 | Native `required` would stop an empty prompt in the browser, so the roadmap's "an empty prompt shows its error" would never reach the server's message. | Warning | Accepted: D4, `noValidate`. |
| 3 | The action answers only a message; "each error under its field" needs the field. | Warning | Accepted: D3. |
| 4 | The picker's viewport columns would show four truncated columns inside a 640 px dialog. | Warning | Accepted: D1 `layout`. |
| 5 | The theme has no dialog size that is 640 px from md and scrolls inside; adding a local wrapper breaks "packages first". | Suggestion | Accepted: D5, theme props + className, gap filed in SOFTURE/AI. |
| 6 | `scheduled.spec.ts` asserts the menu holds exactly Run now and Delete; Edit changes that. | Suggestion | Accepted: phase 3 updates that one assertion. |
| 7 | e2e projects are shared across specs; the dialog spec needs projects only it watches, or counts and picks drift. | Warning | Accepted: phase 3 uses its own fictional repositories and finds rows by their own titles. |

Verdict: ready to implement.

## Decisions (auto)
- All seven findings accepted as recorded above.
