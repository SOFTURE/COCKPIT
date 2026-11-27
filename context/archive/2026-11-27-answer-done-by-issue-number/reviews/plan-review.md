# Plan review: answer-done-by-issue-number

Verdict: approved with one accepted fix.

## Findings
1. Warning, accepted: the scan must not write a closure before it knows the project's reads did not hit a rate
   limit, or a paused scan leaves half its writes. Fix: read the closures with the other reads, write them after
   `recordRead`, and return `rate_limited` before any write. Applied to step 4 (reads first, writes after).
2. Suggestion, accepted: the migration checks that only a `sent` answer carries a closure (a database constraint
   rather than a code check only).
3. Checked, no finding: every reader of `done` goes through `buildInbox` (inbox, digest, MCP), so no second place
   decides it.
