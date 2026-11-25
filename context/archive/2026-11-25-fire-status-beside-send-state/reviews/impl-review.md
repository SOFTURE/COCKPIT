# Implementation review: fire-status-beside-send-state

Reviewed: cbe1d69 against plan.md. Verdict: approve. Findings: 0 critical, 0 warning, 1 suggestion.

## Lenses
| Lens | Result |
| --- | --- |
| Drift from plan | PASS (shared `FireStatus` shows the state only, name in the tooltip; broadcast fires on the "Sent" line; markup test, e2e, CHANGELOG) |
| Correctness | PASS (a failed or queued fire keeps HTTP status and reason; a removed routine's tooltip reads "removed routine: …") |
| Tests | PASS (markup test failed first on the routine's name, then 3/3; e2e reads "Routine fired" and "Fire failed · HTTP 503 · API error" inside `[data-send-line]` with "Sent") |
| Progress honesty | PASS (screenshots looked at, 1280 and 390, light and dark) |
| Security | PASS (no new input or action) |
| Patterns | PASS (theme `Status` with its `title`; inbox and Recent fires get the same wording through the one component) |

## Findings
- Suggestion: at 390 px a long failure on the broadcast page is cut by the Issue button ("API er…"); the full text is
  in the tooltip. Kept: CT-18 builds the shared row (state on the right column) and settles phone layout there.

## Decisions (auto)
- Approved.
