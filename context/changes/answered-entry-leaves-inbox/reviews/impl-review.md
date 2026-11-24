# Implementation review: answered-entry-leaves-inbox

Scope: full · Date: 2026-11-24 · Gates: typecheck ✓ lint ✓ test ✓ (535/535)

## Verdict
Ready. An entry re-worded while its answer is being settled (its text cites the answer's issue) keeps that answer;
a `(later: #N` mark anywhere in the text puts the entry off; the issue footer tells the project the 0.37.0 settle
rules. A re-wording that cites no issue of an answer still opens the entry again.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | two modules, tests, CHANGELOG |
| Progress honesty | PASS | red run recorded |
| Correctness | PASS | `#9` does not match `#90`; the newest citing answer wins |
| Tests | PASS | no retries, no skipped test |
| Security | PASS | the regular expression is built from a number |

## Findings
None.

## Decisions (auto)
- The e2e is not touched: the inbox page renders the same answer states; CI runs the full e2e as the merge gate.
