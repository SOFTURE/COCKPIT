# Implementation review: grouped-broadcast-picker

Verdict: approve. Reviewed the diff from master 334d25f against `plan.md` and the roadmap item.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | Warning (fixed) | The first fixture group name ("Cedar desk") was already used by `e2e/project-settings.spec.ts`; in the shared database that spec's group count broke. | Fixed: this spec's own owners `rowan-lane`, `willow-hall`; full e2e 111/111. |
| 2 | Warning (filed) | The theme draws an indeterminate checkbox as an unfilled box with a tick, no minus sign. | Filed SOFTURE/AI#1514; `aria-checked="mixed"` carries the state; no local override. |
| 3 | Suggestion | Radix renders the group checkbox's hidden input with the default value "on" but no `name`, so it is never submitted. | Checked: the action reads only `project` fields; nothing to change. |
| 4 | Suggestion | The "before" screenshots exist only for the all-picked state; master has no group checkbox for the other two. | Accepted, noted on Progress 2.2. |

Plan drift: none. The form neither groups nor sorts: the page passes `groupProjects` sections; the picking rules live in
`src/broadcast/project-picks.ts` for CT-38 to move into the shared picker.

## Decisions (auto)
- Findings resolved by the recommended option (autonomous mode).
