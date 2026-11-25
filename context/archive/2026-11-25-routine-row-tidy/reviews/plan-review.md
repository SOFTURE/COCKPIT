# Plan review: routine-row-tidy

Reviewed: plan.md @ 2026-11-25. Mode: standard. Verdict: ready.
Findings: 0 critical, 1 warning, 2 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Coverage and end state | PASS (every Layout line of change.md maps to 1.3 and 1.4) |
| Verifiability | PASS with W-1 |
| Data and migrations | PASS (none) |
| Tests | PASS |
| Security | PASS (actions unchanged; only how they are started) |
| Scope | PASS (owned files only; CT-23/CT-24 rollout left out) |

## Findings
- W-1 (Warning): change.md asks for unit tests of the menu's keyboard behaviour, but the project has no DOM test
  environment. Fix: pin the keyboard behaviour in the e2e (real Chromium, the same radix code the user runs) and the
  pure order rule plus markup in unit tests; record it as a decision. Accepted.
- S-1 (Suggestion): a disabled Test or Replace token item (no ROUTINE_TOKEN_SECRET) must stay visible but disabled,
  not vanish, so the menu's shape does not change. Accepted into 1.3.
- S-2 (Suggestion): give each menu item a `data-row-action` so CT-23/CT-24 specs can select it without copy. Accepted.

## Decisions (auto)
- Plan accepted with W-1, S-1, S-2 applied.
