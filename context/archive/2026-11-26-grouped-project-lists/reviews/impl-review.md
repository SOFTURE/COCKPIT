# Implementation review: grouped-project-lists

Verdict: approve. Reviewed the diff from master d55c2ff against `plan.md` and the roadmap item.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | Warning (fixed) | `repositories.listLabel` ("Watched repositories") had no reader once the watched list moved to the sections, and `e2e/watched-repositories.spec.ts` found its rows through that one list, which would now match several group lists. | Fixed: the key is removed from en and pl; the spec reads the rows through the card's sections (`[data-slot=project-group-sections]`) and the `No group` list. |
| 2 | Suggestion | `OverviewProject.groupId` is optional rather than required. | Kept (plan D2): the digest builds the overview without groups; absent means No group, documented on the field. |
| 3 | Suggestion | The section headings say the count as a bare number to a screen reader ("Elm desk 2"). | Kept: the layout asks for the heading the status sections used, which read the same way; the section's label names the group. |

Plan drift: none. The MCP answer keeps its status groups; only its doc comment changed ("in the screen's order" no longer holds).

## Decisions (auto)
- Findings resolved by the recommended option (autonomous mode).
