# Plan review: wake-projects-by-firing-routines

Reviewed 2026-11-25 against change.md, research.md, lessons and the code. Autonomous mode: every finding decided by
the recommendation.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | Warning | One `no_routine` row per issue needs a unique key with a null routine id. | Production runs `postgres:16` and PGlite is 16-based: the unique index uses `NULLS NOT DISTINCT`. Accepted. |
| 2 | Warning | Deleting a routine would orphan or cascade its fire rows; a foreign key with `SET NULL` would collide with the `no_routine` key. | No foreign key: fire rows keep `routine_id` and `routine_name`; a removed routine reads "removed" and Retry skips it. Accepted into Phase 3. |
| 3 | Warning | The fire text needs the issue title; only the creating code knows it. | `wakeIssue` takes `{ number, url, title }`; the fire row stores the title so Retry and the drain rebuild the same text. Accepted. |
| 4 | Warning | `answerEntry` serves the inbox, MCP and CLI: wiring the wake only into the inbox action would leave MCP answers asleep. | The wake goes inside `answerEntry` with an injected `wake` dependency (null in tests that do not need it). Accepted. |
| 5 | Suggestion | Retry of a `no_routine` issue after a routine was added. | Retry replaces the `no_routine` row with one row per enabled routine. Accepted. |
| 6 | Warning | Encryption without a package helper is a local workaround (SOFTURE rule "packages first"). | Kept local and minimal (one file) because the owner's spec needs it now; the gap is filed in SOFTURE/AI (or put in the report if out of reach). Accepted. |
| 7 | Suggestion | A stuck `sending` row after a crash. | Rows `sending` for over 2 minutes count as stale; Retry and the drain take them over. Accepted. |

Verdict: ready to implement with the decisions above.
