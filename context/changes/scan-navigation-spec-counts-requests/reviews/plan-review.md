# Plan review: scan-navigation-spec-counts-requests

Verdict: approved (auto, autonomous mode).

| # | Severity | Finding | Decision |
|---|---|---|---|
| 1 | Warning | A longer timeout alone would let the old bug pass whenever the scan ends early. | The count is the guard: the old code makes a request every 2 s while the scan runs, more than 3 within 6 s; the timeout only bounds load. |
| 2 | Warning | Link prefetches of `/projects` also carry `rsc: 1` and would inflate the count. | Prefetch requests (`next-router-prefetch`, `next-router-segment-prefetch`) are excluded. |
| 3 | Suggestion | 3 is tight if the router ever adds a trip. | Kept tight on purpose; the comment names where each request comes from, so a router upgrade that changes it is visible. |
