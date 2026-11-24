# Implementation review: app-shows-what-waits-for-deploy

Reviewed the branch against plan.md, change.md and the plan review (commits 063344a, 4647c82 and the fix below).

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | The releases schema was tightened to a non-empty `tag_name`: one odd release would have made the whole page of releases invalid and dropped the deploy reports that read before. | Fixed: the schema is back to any string; the last release skips an empty tag instead. |
| 2 | SUGGESTION | Merged changes count pull requests only; a project that pushes to its main branch directly shows 0. | Kept (plan decision): the item asks for merged changes; the compare list is the only read, and a direct push is not a reviewed change. |
| 3 | SUGGESTION | A tag that contains `/` is percent-encoded in the compare path. | Kept: the forge accepts encoded refs; release tags written by the deploy pipeline carry no `/`. |
| 4 | SUGGESTION | The compose path is fixed to the `env render` default. | Kept (plan decision): a project with another path shows "could not be compared", never a wrong warning. |

Drift from the plan: none. Progress is honest: every ticked item has its evidence (test run, e2e run, screenshots in
`cockpit/evidence/app-shows-what-waits-for-deploy/`). No CRITICAL finding.

Verdict: ready to archive.
