# Implementation review: repository-picker

Scope: full · Date: 2026-11-23 · Commits: f98fb41 · Gates: typecheck ✓ lint ✓ test ✓ doctor ✓

## Verdict
Ready. `listReadableRepositories` reads `/user/repos` (100 per page, at most 5 pages, archived left out) and the
Settings page offers those not watched yet in a combobox built on theme-notion's `Command`. Picking fills the field;
the Add button and Enter with nothing highlighted submit as before, so typing `owner/name` still works and the
server action keeps its access check. Without a token or when the list fails, the field reads as before with a hint
that says so.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | |
| Progress honesty | PASS | red run recorded |
| Correctness | PASS | open list inspected at 1280 and 390 px, light and dark |
| Tests | PASS | unit 4 cases; e2e pick-and-add, no longer offered, Enter submits typed text |
| Security | PASS | GET only; the no-other-writes test still passes |

## Findings
None.

## Decisions (auto)
- The command menu names its input itself, so the visible "Repository" label is hidden from assistive technology and
  the same text is passed as the menu's label; `getByLabel("Repository")` keeps working in every spec.
