# Plan review: issues-labelled-cockpit

Reviewed: plan.md @ 2026-11-25. Mode: light (one label, one fallback, no data change). Verdict: ready.
Findings: 0 critical, 1 warning, 0 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (writes, reads, copy, fakes) |
| Verifiability | PASS (unit tests per branch of the pick, e2e on a production build) |
| Data and migrations | PASS (none; stored issues keep their numbers) |
| Tests | PASS |
| Security | PASS (no new write; no label creation) |
| Scope | PASS (markers and titles untouched) |

## Findings
- Warning: a project that has the `cockpit` label but still runs skills ≤ 0.37 would not see the new issues. The
  installer of 0.38 is what creates the label, so the two arrive together; a label created by hand earlier is the
  owner's choice. Recorded in the report; no code change.

## Decisions (auto)
- Plan accepted.
