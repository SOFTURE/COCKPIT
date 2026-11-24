# Implementation review: inbox-tabs-per-project

Scope: full · Date: 2026-11-24 · Commits: 562bfd1 · Gates: typecheck ✓ lint ✓ test ✓ (532/532) e2e ✓ (65/65) doctor ✓

## Verdict
Ready. The inbox draws the theme's `TabBar` (touch size on a phone, control height from md up, as on the project
page) with "All" and one tab per project with entries, each with an icon and a counter of entries waiting. A project
tab carries the initials of its repository name (`ORDER_TRACKER` → `OT`), or the bare name for a one-word name or a
repeated code; the shown project lives in the address (`?project=owner/name`). Inside a project tab the rows drop the
project name, the waiting card links the project, and the "Later" group and the history are filtered to it.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | one page, one pure function, two message keys per locale, one e2e and one evidence screen |
| Progress honesty | PASS | unit tests ran red (module missing) before the function existed |
| Correctness | PASS | screenshots light/dark at 1280 and 390 inspected (All tab and a project tab) |
| Tests | PASS | initials, one-word name, collisions, no projects, counts, later-only project, requested / unknown tab |
| Security | PASS | `project` only selects among the projects already in the inbox; nothing else is read from it |

## Findings
- Suggestion: the tab bar has no tooltip (the theme's `TabBar` takes none); the full name sits in the waiting card
  of a project tab and in every row of the All tab. Left as is.

## Decisions (auto)
- Tabs ordered by label; All first. A project with only "later" entries keeps a tab with counter 0.
