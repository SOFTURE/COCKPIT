# Implementation review: routine-row-tidy

Reviewed: branch `claude/project-thread-ps3ta3` @ 0e65db9 against plan.md. Verdict: ready to archive.
Findings: 0 critical, 0 warning, 2 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Drift from plan | PASS (one addition: `opensDialog` on `RowAction`, see Decisions) |
| Correctness | PASS (Test result still announced; dialogs get focus and return it to the menu button) |
| Tests | PASS (unit: order rule, trigger, row markup; e2e: keyboard, pointer, layout boxes at 1280 and 390 px) |
| Honest Progress | PASS (every item has its evidence and SHA) |
| Migrations | PASS (none) |
| Security | PASS (same server actions, same hidden fields) |
| Project patterns | PASS (messages in en and pl, design tokens only, `data-*` selectors kept) |

## Findings
- S-1 (Suggestion): the badge uses the app's one `formatTime` (date and time), so it reads "HTTP 200 · Nov 25,
  2026, 10:45 PM" rather than the change's "21:04" example. Decision: keep; a time without a date misleads for an
  older call and every other row uses the same formatter.
- S-2 (Suggestion): the e2e first raced the menu's own focus (keys pressed before the menu focused its first item, and
  a Test still running kept its item disabled). Fixed in the test by waiting for the focus each key moves and for the
  row's `aria-busy="false"`; the product behaviour (a running Test disables its item) is intended.

## Decisions (auto)
- `RowAction.opensDialog`: an item that opens a dialog tells the menu not to take focus back to its button on close,
  so the dialog keeps focus; the dialog returns it through `useRowMenuFocus`. Found by the e2e, kept as part of the
  shared component for CT-23.
- SOFTURE/AI#1487 filed: `@softure-ai/testing` has no DOM environment for component interaction tests.
