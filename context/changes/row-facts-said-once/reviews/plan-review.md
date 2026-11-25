# Plan review: row-facts-said-once

Reviewed: plan.md @ 2026-11-25. Mode: standard (autonomous). Verdict: ready.
Findings: 0 critical, 1 warning, 2 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (every list named in change.md has a verdict in research.md; each repeat maps to 1.2 or 1.3) |
| Verifiability | PASS with W-1 |
| Data and migrations | PASS (none) |
| Tests | PASS (a unit test per moved fact, one e2e per touched screen at both widths) |
| Security | PASS (no action changes; links keep `rel="noreferrer"`) |
| Scope | PASS with S-1 (`wake-chip.tsx` read only; CT-23's broadcast untouched) |

## Findings
- W-1 (Warning): changing Scan status's "Read <time>" breaks `READ_AT`, which `e2e/cli.spec.ts` also uses for the
  overview's own "Read <time>". Fix: a separate `CHECKED_AT` for Scan status; `READ_AT` stays for the overview. Accepted
  into 1.5.
- S-1 (Suggestion): do not edit `IssueWakeStatus`; compose `IssueFireBadges` and `RetryWakeForm` in the inbox row, so
  CT-23 can change `wake-chip.tsx` in parallel without a conflict. Accepted (already in Key decisions).
- S-2 (Suggestion): the right-column helper should also fail on an empty-text link (an icon-only `a`) only if it is not
  labelled; keep it simple: allow `a` and `button` with an accessible name, and any text inside `[data-slot=badge]`,
  `[data-slot=status]`, `button`, `[role=switch]`, `label` of a control, or `[data-row-wide]`. Accepted.

## Decisions (auto)
- Plan accepted with W-1, S-1, S-2 applied.
