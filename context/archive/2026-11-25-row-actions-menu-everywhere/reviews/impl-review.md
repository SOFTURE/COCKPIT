# Implementation review: row-actions-menu-everywhere

Reviewed: branch `claude/project-thread-mvn1a2` @ 9ddb0ba against plan.md. Verdict: ready to archive.
Findings: 0 critical, 0 warning, 2 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Drift from plan | PASS (one addition: the menu run by tap at 390 px, see S-2) |
| Correctness | PASS (same server actions and fields inline and in the menu; items disabled while their action runs) |
| Tests | PASS (unit: the rule for every combination, the row's markup for 0 to 3 controls; e2e: boxes at 1280 and 390 px, keyboard, pointer, tap, Retry the fire from the menu with its effect checked at the fake routines API) |
| Honest Progress | PASS (every item has its evidence and SHA) |
| Migrations | PASS (none) |
| Security | PASS (no new action; the issue opens with `noopener,noreferrer`, as the inline link's `rel="noreferrer"`) |
| Project patterns | PASS (messages in en and pl, design tokens only, `data-send-line` kept, shared `RowActionsMenu` unchanged) |

## Findings
- S-1 (Suggestion): the menu's "Open issue" and "Retry the send" items only appear on a send with an issue and a
  Retry send at once, which the UI cannot produce (research); they are pinned by the markup test and use the same
  action and fields as the inline controls. Decision: keep as is (plan review W-1).
- S-2 (Suggestion): the 390 px test only checked touch sizes; added the menu opened by a tap, inside the screen, its
  item touch-sized, and Retry the fire run from it. Applied in 9ddb0ba.

## Baseline check
- `actions={[` outside `RowActionsMenu` with more than one control: none (the two left, inbox and packages, hold text,
  CT-24's lane).

## Decisions (auto)
- Inline control: Retry send when present, else the Issue link, else Retry the fire (`pickSendControls`).
- Menu labels "Open issue #N", "Retry the fire", "Retry the send", so two retries never read the same.
