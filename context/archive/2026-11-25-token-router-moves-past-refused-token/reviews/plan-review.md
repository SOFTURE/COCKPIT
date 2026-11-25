# Plan review: token-router-moves-past-refused-token

## Verdict
Approved (auto).

## Findings
1. **Warning: a stale hint must not cost every later call a refused request.** Decision: covered; the move-on answer
   drops the pick and the owner hint, and the token that answers becomes the new hint.
2. **Check: a write the forge may have taken is still never retried.** Confirmed: `unavailable` and `invalid_answer`
   stay outside both move-on sets.
3. **Check: the token label never carries token text.** Confirmed: labels come from the environment names and
   positions in `forge-access.ts`.
4. **Suggestion: a migration for one column.** Decision: accepted; forward-only, nullable, rollback noted in the file.
