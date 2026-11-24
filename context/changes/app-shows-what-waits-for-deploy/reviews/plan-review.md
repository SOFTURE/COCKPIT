# Plan review: app-shows-what-waits-for-deploy

Reviewed against change.md, research.md and the code on master 6f74036.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | Stored deploy values from earlier scans lack the new field; a required field would turn every stored read into "unknown". | Applied: `waiting` is optional and nullable in the schema; the view treats a missing one as nothing to show. |
| 2 | WARNING | A rate limit on one of the three new reads must stop the scan, not store a half state. | Applied: any `rate_limited` answer returns `rate_limited` for the whole read; tested. |
| 3 | WARNING | The existing unit tests assert the whole stored value with `toEqual` and script every forge call; the new reads would fail them as unscripted calls. | Applied: the test helper answers the new reads with 404 by default, and the expectations gain `waiting`. |
| 4 | SUGGESTION | Release drafts appear in the releases list only for writers, but a token with more scopes would see them. | Applied: the last release skips drafts. |
| 5 | SUGGESTION | The sidebar's icon record is typed by key: a new key without an icon fails the typecheck, which is the guard. | Applied: icon added with the entry. |
| 6 | SUGGESTION | e2e specs share a database; the Deploys page lists every app with a deploy workflow, also the omega ones. | Applied: the spec locates rows by `data-project`, never by count. |

Verdict: ready to implement after the fixes above (applied to the plan).
