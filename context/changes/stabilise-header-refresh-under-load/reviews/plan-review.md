# Plan review: stabilise-header-refresh-under-load

## Verdict
Approved (auto).

## Findings
1. **Warning: a scaled timeout can hide a slow scan.** Decision: accepted as planned; the budget is per counted
   project (3 s, about 1.5× the worst observed under load), so a scan that slows per project still fails.
2. **Suggestion: hints could send a call to a token that lost access.** Decision: covered; `not_found` and
   `unauthorized` move on to the next token and the hint follows the token that answered.
3. **Check: no Playwright retries, no skip, FR-3 start budget unchanged.** Confirmed in the plan.
