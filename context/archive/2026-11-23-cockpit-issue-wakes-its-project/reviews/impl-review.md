# Implementation review: cockpit-issue-wakes-its-project

Reviewed: branch `claude/project-thread-r25pwe` against plan.md @ 2026-11-24. Mode: standard (autonomous).
Verdict: approve. Findings: 0 critical, 1 warning, 2 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Plan drift | PASS (adapter instead of a forge fact as planned; no migration) |
| Correctness | PASS (zod enum rejects any value the doctor rejects; a missing file is absent) |
| Tests | PASS (adapter, view, overview and broadcast view unit tests; e2e with three fixtures) |
| Progress honesty | PASS (every ticked item names its evidence) |
| Migrations | PASS (none) |
| Security | PASS (one GET under Contents read; no write, NFR-7; the setup link is a fixed public URL) |
| Language gate | PASS (`softure-check-language --all`; Polish only in `messages/pl.ts`) |

## Findings
- W-1 (warning): the e2e fake forge served `files` as a base64 envelope, which the raw read of `getJsonFile` took
  for a workflow without the key; a fixture would have shown "Waits for its next run" for a routine. Fixed: the fake
  serves `context/workflow.json` raw, as the real forge does for `application/vnd.github.raw+json` and as it already
  serves `context/state.json` and the rules file.
- S-1 (suggestion): the MCP and terminal answers do not carry the wake-up. Not taken: outside the item's Touches;
  a later item can add it.
- S-2 (suggestion): a declared routine that does not exist still reads "Wakes on its own" (the roadmap's named risk).
  Accepted as is: the hint and the README say COCKPIT reads only the declaration.

## Decisions (auto)
- Approved with W-1 fixed.
