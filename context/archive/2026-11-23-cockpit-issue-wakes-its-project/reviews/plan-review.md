# Plan review: cockpit-issue-wakes-its-project

Reviewed: plan.md @ 2026-11-24. Mode: standard (autonomous). Verdict: ready after one accepted fix.
Findings: 0 critical, 1 warning, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (overview, project page, broadcast page, README, declaration, skills bump) |
| Verifiability | PASS (vitest on the adapter and views; e2e on the fake forge; screenshots) |
| Data and migrations | PASS (no migration: `adapters.reads` holds the read) |
| Tests | PASS after W-1 |
| Security | PASS (one more GET under Contents read; no write; the setup link is a fixed public URL) |
| Scope | PASS (MCP and CLI stay out, as in the roadmap's Touches) |

## Findings
- W-1 (warning): the e2e fake forge answers 404 for unknown files; existing fixtures must keep showing no wake chip,
  and other specs that count chips must not break. Accepted: only new `wake-*` fixtures serve a `workflow.json`.
- S-1 (suggestion): the doctor accepts only the three strings; a project with `ownerWordWake: true` should read as
  unknown, not as "routine". Accepted: the adapter validates with a zod enum.

## Decisions (auto)
- Plan accepted with W-1 and S-1 applied in implementation.
