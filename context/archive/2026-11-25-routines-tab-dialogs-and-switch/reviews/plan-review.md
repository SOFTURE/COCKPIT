# Plan review: routines-tab-dialogs-and-switch

Reviewed: plan.md @ 2026-11-25. Mode: light (one tab, two shared shell components, no migration). Verdict: ready.
Findings: 0 critical, 1 warning, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (every F-11 point maps to a step) |
| Verifiability | PASS (unit test for kinds, e2e through dialogs, screenshots) |
| Data and migrations | PASS (none; kinds stay stored as `cockpit-issues`) |
| Tests | PASS |
| Security | PASS (actions keep `requireUser`; the token never returns to the page) |
| Scope | PASS (fire wording is CT-13, recent fires CT-15) |

## Findings
- Warning: hiding Test's visible result removes the only on-the-spot feedback. Accepted mitigation: the action
  revalidates, so the row's last-call badge changes at once; the live region still announces it.
- Suggestion: a client component must not import `modules/projects/routines.ts` (drizzle). Accepted: the kinds live
  in `routine-kinds.ts` with no imports, re-exported by `routines.ts`.

## Decisions (auto)
- Plan accepted.
