# Plan review: project-page-and-roadmap-view

Reviewed: plan.md @ 2026-11-23. Mode: standard (one new route, one new forge read, no migration). Verdict: ready.
Findings: 0 critical, 1 warning, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (every function of the page is listed in change.md and kept) |
| Verifiability | PASS (parser unit tests, e2e on a production build, screenshots inspected) |
| Data and migrations | PASS (none; the scan is unchanged) |
| Tests | PASS (TDD for the parser; existing e2e assertions on link names updated deliberately) |
| Security | WARN, see below |
| Scope | PASS (overview, inbox screen and MCP untouched) |

## Findings
- Warning: the roadmap path comes from the project's own `state.json`, which is untrusted repository text. Reading
  it as a path could reach any file of the repository. Fix: read only paths under `context/` that end in `.md`, and
  only the paths the stored state names for that slug. Accepted, added to the parser/loader contract.
- Suggestion: the e2e spec "Roadmap file" link and the queued title link point at the forge today; keep a secondary
  "Open on GitHub" action on the roadmap view so the forge link stays one click away. Accepted.

## Decisions (auto)
- Plan accepted with both findings applied.
