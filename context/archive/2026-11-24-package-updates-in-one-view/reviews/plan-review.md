# Plan review: package-updates-in-one-view

Reviewed: plan.md @ 2026-11-24. Mode: standard (autonomous). Verdict: ready after two accepted fixes.
Findings: 0 critical, 2 warnings, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (every part of the outcome: update, held with issue, versions vs npm, "no update yet") |
| Verifiability | PASS (vitest on adapter and view; e2e on the fake forge and a fake registry; screenshots) |
| Data and migrations | PASS (no migration: `adapters.reads`) |
| Tests | PASS after W-1 |
| Security | PASS after W-2 |
| Scope | PASS (MCP, CLI and digest stay out, as in the roadmap's Touches) |

## Findings
- W-1 (warning): the fake forge answers `/actions/runs` with the same list whatever the query, and serves `files`
  as base64 that the raw `getJsonFile` does not read. Accepted: the fake filters runs by `head_sha` when asked and
  serves the new fixtures' `package.json` and `package-lock.json` raw.
- W-2 (warning): the registry answer and the pull request URL are rendered as links and text. Accepted: zod narrows
  both; link targets are https/http only (`z.url` with a protocol), issue links are built from the forge web origin.
- S-1 (suggestion): a lockfile of a large app can be big. Accepted as is: the raw contents API serves it in one
  answer, one read per project per scan.

## Decisions (auto)
- Plan accepted with W-1 and W-2 applied in implementation.
