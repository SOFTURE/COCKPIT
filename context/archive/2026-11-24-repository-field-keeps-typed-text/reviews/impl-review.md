# Implementation review: repository-field-keeps-typed-text

Scope: full · Date: 2026-11-24 · Commits: b3df3e8 · Gates: typecheck ✓ lint ✓ test ✓ (441/441) e2e ✓ (60/60, 4 runs)

## Verdict
Ready. Settings renders one `AddRepositoryForm` outside any Suspense; the token's list reaches it as a promise and
joins the field when it resolves, so the typed value and the action state survive. The "list read at / Refresh list"
row streams in its own Suspense from the same promise. The new e2e reproduces #55 on master's page (red) and passes
with the fix; the workaround in `e2e/submit-repository.ts` is gone.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | plus the `mcp.spec.ts` race found by the 4-worker run |
| Scope | PASS | page, form, e2e support, CHANGELOG |
| Progress honesty | PASS | the failed 4-worker run is recorded |
| Correctness | PASS | a rejected promise falls back to `unavailable`; a newer promise keeps the last suggestions until it resolves |
| Tests | PASS | no retries, no skipped test; the inbox-count check now compares with a fresh answer instead of a stale one |
| Security | PASS | no new input; the add action is unchanged |

## Findings
None.

## Decisions (auto)
- `mcp.spec.ts` compared the global inbox count, which other specs change meanwhile, with an answer read earlier;
  under 4 workers it saw 10 instead of 9. Fixed in this change (owner rule: a test that fails once is a bug to fix
  in the same thread), with an exact match instead of a substring.
