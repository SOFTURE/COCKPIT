# Implementation review: list-rows-one-shape

Reviewed: branch `claude/project-thread-prvcuk` against plan.md. Verdict: ready to archive.
Findings: 0 critical, 0 warning, 2 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Drift from plan | PASS (both components; every listed screen moved; project views left to CT-19) |
| Correctness | PASS (no row text changed; `data-*` selectors kept; Retry, Issue, trash and switch reachable above the stretched link) |
| Tests | PASS (tone map and badge pinned; row slots and stretched link pinned; e2e reads the state in the right column at 1280 and 390 px on Broadcast detail, Scan status, watched repositories, Team, a routine and a recent fire) |
| Progress honesty | PASS |
| Migrations | PASS (none) |
| Security | PASS (external links `rel="noreferrer"`, no new input) |
| Patterns | PASS (colours only through the theme's tones; `StatusActionFoldRow` keeps the fold rows) |

## Findings
- Suggestion: on a phone the routine row's four controls wrap over two lines under the badges. Accepted as is: each
  stays 44 px and right-aligned; the theme row (SOFTURE/AI#1481) may settle a denser layout.
- Suggestion: the inbox still uses `IssueWakeStatus` (fires and Retry in one line). Deferred: the inbox moves onto
  `ListRow` in CT-19.

## Decisions (auto)
- Broadcast "sent" and fire "queued" read grey (pending), failures red, repository and scan "no state" orange.
- The phone breakpoint of the row: the identity keeps at least 160 px (`basis-40`) before the right column wraps.
