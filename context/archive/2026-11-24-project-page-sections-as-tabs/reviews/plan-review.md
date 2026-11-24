# Plan review: project-page-sections-as-tabs

Reviewed: plan.md @ 2026-11-24. Mode: light (one page, one pure function, e2e updates). Verdict: ready.
Findings: 0 critical, 1 warning, 1 suggestion.
Grounding: 11/11 paths, 4/4 commands

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (four tabs, counts, default tab, phone size, answer from a tab) |
| Verifiability | PASS (unit tests for the tab rule, e2e on a production build, inspected screenshots) |
| Data and migrations | PASS (none) |
| Tests | PASS |
| Security | PASS (the `tab` parameter only selects among fixed keys; nothing else is read from it) |
| Scope | PASS |

## Findings
- Warning: sections hidden behind a tab disappear from specs that look for them on the default page (deploy,
  health, wake, the pi-app read failure). The plan lists those specs; each now opens its tab by address. Accepted.
- Suggestion: the polish spec checks only the default tab for English copy; the tab labels themselves are on every
  tab, so their Polish keys are covered. Accepted as is.

## Decisions (auto)
- Plan accepted. The wake card moves into the Waiting tab (research, answers to the unknowns).
