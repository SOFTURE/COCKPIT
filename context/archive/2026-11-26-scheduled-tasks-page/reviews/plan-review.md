# Plan review: scheduled-tasks-page

Reviewed against change.md, research.md and the code at master 334d25f (auto mode).

| # | Finding | Severity | Decision |
| --- | --- | --- | --- |
| 1 | The roadmap names `createTimeFormatter` for times, yet its layout example carries a weekday ("Mon 30 Nov, 08:00"), which the formatter does not print. | Suggestion | Accepted: D3, a weekday formatter beside it in the same file; the done row's sent time keeps `createTimeFormatter`. |
| 2 | A `sending` task in the Scheduled tab would offer Run now and Delete, which both refuse it. | Warning | Accepted: D2, a sending row shows a muted "Sending" badge and no menu. |
| 3 | A run that failed before sending (`no_projects`) has no broadcast; a link to `/broadcast/<id>` would 404. | Warning | Accepted: D2, href only when the broadcast has sends. |
| 4 | The e2e shares its database with every spec; a fixed count of tasks would break if another spec added any. | Suggestion | Accepted: only this spec creates tasks (D6); rows are found by their own titles. |
| 5 | The menu actions return a failure state the theme menu ignores; a refused Run now would pass silently. | Warning | Accepted: D5. |

Verdict: ready to implement.

## Decisions (auto)
- All five findings accepted as recorded above.
