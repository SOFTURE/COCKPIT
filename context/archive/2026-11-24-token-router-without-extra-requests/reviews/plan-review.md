# Plan review: token-router-without-extra-requests

## Verdict
Approved (auto).

## Findings
1. **Suggestion: hints could send a call to a token that lost access.** Decision: covered; `not_found` and
   `unauthorized` move on to the next token and the hint follows the token that answered.
2. **Check: a write that the forge may have taken is never retried.** Confirmed: only `refused`, `not_found` and
   `unauthorized` move a write on.
