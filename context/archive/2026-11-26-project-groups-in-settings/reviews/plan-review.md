# Plan review: project-groups-in-settings

Reviewed against change.md, research.md and the code at master d81f512 (auto mode).

| # | Finding | Severity | Decision |
| --- | --- | --- | --- |
| 1 | The layout says the Settings list is "ordered as `groupProjects` orders them", but `groupProjects` drops empty groups, which Settings must still show to rename or delete. | Warning | Accepted: D1, shared `compareGroupNames`. |
| 2 | The e2e step "projects show under No group on the Projects page" cannot pass before CT-32 groups that page. | Warning | Accepted: D6, moved to CT-32's e2e; recorded for the coordinator. |
| 3 | A seed of an empty e2e database creates no group, so "seeded groups listed with counts" must be built by the spec itself. | Suggestion | Accepted: groups made with a default owner, then repositories of that owner added (also covers the add rule). |
| 4 | Duplicate detection must not rely on a pre-read (race). | Suggestion | Accepted: D4, unique constraints decide. |

Verdict: ready to implement.

## Decisions (auto)
- All four findings accepted as recorded above.
