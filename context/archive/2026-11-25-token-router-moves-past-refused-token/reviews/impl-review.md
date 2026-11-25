# Implementation review: token-router-moves-past-refused-token

## Verdict
Approved (auto). The diff matches the plan.

## Findings
1. **Check: a write the forge may have taken is never retried.** Confirmed: `unavailable` and `invalid_answer` stay
   outside `MOVE_ON`; "does not retry a write the forge may have taken" still passes.
2. **Check: no token text reaches a failure, the database or the page.** Confirmed: labels come from
   `getForgeTokenLabels` (environment names and positions); the router only spreads that label into the failure.
3. **Suggestion: the label follows the de-duplicated token list.** Decision: accepted as is; a token listed twice is
   read once, so `FORGE_EXTRA_TOKENS[n]` counts distinct tokens. Documented in `forge-access.ts`'s labels comment.
4. **Check: the memory forge now answers repository metadata.** It always should have (the real forge does); the
   broadcast tests over a router need it, the other tests never asked it.
