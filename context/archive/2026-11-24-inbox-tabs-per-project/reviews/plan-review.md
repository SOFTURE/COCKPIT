# Plan review: inbox-tabs-per-project

Reviewed: plan.md @ 2026-11-24. Mode: light (one page, one pure function, e2e addition). Verdict: ready.
Findings: 0 critical, 1 warning, 1 suggestion.
Grounding: 7/7 paths, 4/4 commands

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (All + project tabs, short labels, counters, later group kept, rows without name) |
| Verifiability | PASS (unit tests, e2e on a production build, inspected screenshots) |
| Data and migrations | PASS (none) |
| Tests | PASS |
| Security | PASS (`project` only selects among the projects already in the inbox) |
| Scope | PASS |

## Findings
- Warning: initials of two words can be cryptic (`REMOTETRIP_PL` → `RP`). The project tab names the full
  repository in the waiting card's description, and the All tab keeps the names. Accepted.
- Suggestion: the answer form posts back to `/inbox` without the query; check that the server action re-renders the
  same address. It revalidates the current page (as the project page's tab), so the tab stays. Accepted.

## Decisions (auto)
- Labels are initials (owner: "short codes, at worst the project name"); collisions and one-word names use the name.
