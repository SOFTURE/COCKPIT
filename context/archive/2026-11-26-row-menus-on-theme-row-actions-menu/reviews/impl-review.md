# Implementation review: row-menus-on-theme-row-actions-menu

Reviewed: branch `claude/project-thread-f05vmb` against plan.md @ 2026-11-26. Mode: autonomous. Verdict: approve.
Findings: 0 critical, 1 warning, 2 suggestions.

## Checks
| Check | Result |
| --- | --- |
| Drift from plan | none: both callers on the theme's `RowActionsMenu`, local menu and its test deleted |
| Baseline | no file imports `src/shell/row-actions-menu.tsx` (gone); routines and broadcast e2e pass (6/6) |
| Tests | builders unit tested (9 tests); e2e pins order, focus, 44 px items, the held delete |
| Security | unchanged: same server actions, same fields, authorization in the actions |
| Language and tokens | English only; no raw colours; copy from `messages/*` |

## Findings
- W-1 (Warning): the theme's confirmation buttons are 28 px on a phone, today's app dialog had 44 px. Decision: filed
  SOFTURE/AI#1502; used as it is (no local override); a bump fixes it.
- S-1 (Suggestion): a rejected delete leaves the dialog open with no message. The routine's `remove` action returns no
  failure value today (a thrown error is a bug and reaches the error boundary as before). Decision: no change.
- S-2 (Suggestion): the `aria-busy` wrappers are gone; a running action's item is disabled instead, and the e2e waits on
  the Test result and the retry's server-action response. Decision: accepted (the wrapper would keep the trigger off
  the slot's 44 px rule).
