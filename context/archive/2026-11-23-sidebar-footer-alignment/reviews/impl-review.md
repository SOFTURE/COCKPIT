# Implementation review: sidebar-footer-alignment

Scope: full · Date: 2026-11-23 · Commits: e460854 · Gates: typecheck ✓ lint ✓ test ✓ doctor ✓

## Verdict
Ready. The footer gives `LogoutButton`'s form a class that makes the button a full-width sidebar row (text at the
left, `px-2`, row height of the navigation rows) and pulls the row out over the footer's padding, so the "Log out"
text starts exactly where "Signed in as …" starts. The e2e measures both text edges in one frame on a production
build, at 1280 and in the 390 sidebar sheet: 17 px apart on master, 0 after.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | one class constant in the shell |
| Progress honesty | PASS | red run recorded before the fix |
| Correctness | PASS | screenshots light/dark at 1280 and 390 inspected |
| Tests | PASS | e2e waits for the sheet's animation before measuring |
| Security | PASS | the same form posts to the same action |

## Findings
None.

## Decisions (auto)
- The descendant-selector workaround stays until SOFTURE/AI#1439 offers a class for the button or a sidebar account piece.
