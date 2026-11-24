# Implementation review: project-page-sections-as-tabs

Scope: full · Date: 2026-11-24 · Commits: 0e22996 · Gates: typecheck ✓ lint ✓ test ✓ (448/448) e2e ✓ (59/59) doctor ✓

## Verdict
Ready. The project page draws the theme's `TabBar` with an icon and a counter per tab (Waiting = entries,
Roadmaps = active + queued, Changes = open changes, Production without a counter and only when health or deploy
reports) and renders only the shown tab. The tab is a link (`?tab=`); the e2e switches tabs by link, checks the
address, goes back, answers an entry from the Waiting tab and finds the reload on the same tab. On a 390 px phone the
tab links measure at least 44 × 44 and the page has no horizontal scroll.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | one page, one pure function, own message keys, e2e reaching sections through their tab |
| Progress honesty | PASS | unit tests ran red (module missing) before the function existed |
| Correctness | PASS | screenshots light/dark at 1280 and 390 inspected |
| Tests | PASS | default tab, unknown and unavailable `tab`, no state, production only when reported |
| Security | PASS | `tab` only selects among fixed keys; nothing else is read from it |

## Findings
- Suggestion: at 390 px with three or four tabs the bar scrolls sideways (the theme's `overflow-x-auto`), so the
  last tab can sit partly off screen. That is the theme's phone behaviour for a tab bar; left as is.

## Decisions (auto)
- The wake card sits in the Waiting tab below the entries rather than above the tabs (fewer boxes, the owner's point).
- Polish labels: Czeka, Roadmapy, Zmiany, Produkcja (short, so the bar fits a phone).
