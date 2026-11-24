# Plan review: projects-of-several-forge-owners-watched

Reviewed: plan.md @ 2026-11-24. Mode: light (one seam behind an unchanged interface, one optional secret).
Verdict: ready. Findings: 0 critical, 2 warnings, 0 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (reads, the write, Settings' list, the unreadable message and the deploy each have a step) |
| Verifiability | PASS (unit tests on the router; production-stack test; e2e with a second token on the fake forge) |
| Data and migrations | PASS (none) |
| Tests | PASS (the baseline's two-token scan and issue creation are unit tests) |
| Security | PASS (least privilege unchanged; tokens never logged; the one write stays createIssue) |
| Scope | PASS (callers unchanged) |

## Findings
- Warning: `hasLabel` maps 404 to `false`, so routing by answer would accept a token that cannot see the repository.
  Accepted: the router picks by `getRepository` before any repository call (plan step 1).
- Warning: retrying a write on `unavailable` could create the issue twice. Accepted: the write moves on only on
  `refused`, `not_found` and `unauthorized`, which create nothing.

## Decisions (auto)
- Plan accepted; pick by metadata read instead of the roadmap's recommended list (research, option 1).
