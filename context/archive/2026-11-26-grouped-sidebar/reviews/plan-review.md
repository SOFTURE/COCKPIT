# Plan review: grouped-sidebar

Reviewed against change.md, research.md and the code on master `8a81353`.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | Warning | Three e2e specs find sidebar links through the "Projects" list, which disappears once projects exist. | Covered in Phase 2: they read "No group" (example-org has no group). |
| 2 | Warning | The "Projects" navigation link is also active on a project page; a test counting every active link would be wrong. | Accepted: count the active link among project links only. |
| 3 | Suggestion | The theme's label does not truncate; a long group name would wrap or overflow. | Accepted: a `truncate` span with `title` inside the label, no override of the theme's style. |
| 4 | Warning | Phone risk: labels could push the footer off a 390 × 844 screen. | Covered: `SidebarContent` scrolls; e2e asserts the footer stays on screen. |
| 5 | Suggestion | Reusing `projectGroupSections.noGroup` would need a second copy prop. | Accepted D2: one shell key. |

Verdict: proceed.

## Decisions (auto)
- All findings resolved in the plan; no change of scope.
