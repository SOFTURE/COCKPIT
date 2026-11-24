# Implementation review: stabilise-header-refresh-under-load

## Verdict
Approved (auto). The diff matches the plan: the spec keeps the FR-3 start budget and scales only the finish wait with
the counted projects; the router moves on only for answers that say the token cannot see the repository.

## Findings
1. **Suggestion: a stale owner hint costs one extra request after a token's selection changes.** Decision: accepted;
   the next token answers and the hint moves to it (covered by the router tests).
2. **Check: `hasLabel` never reads a missing label from a token that cannot see the repository.** Confirmed by
   "does not take a missing label from a token that cannot see the repository".
3. **Check: no retries, no skipped test, no loosened assertion.** Confirmed.
