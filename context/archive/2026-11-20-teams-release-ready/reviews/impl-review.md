# Implementation review: teams-release-ready

Reviewed the diff 46fe101..7518137 against plan.md, change.md, the roadmap (CMP-19, CMP-20) and AGENTS.md.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | SUGGESTION | The test rebuilds the auth module with fewer options than the app's (no routes, password policy). | Accept: the invitation path reads only `invitations` and the app origin; the app's own options are unchanged and covered by `tests/team/members.test.ts`. |
| 2 | SUGGESTION | The dry run checks that `ops/grant-role.mjs` exists instead of running it. | Accept: the create-account dry run writes nothing, so no account exists to grant; the script itself is the package's and runs in the e2e setup. |

Drift from plan: none. Tests: production on the console sender turns all three invitation mail tests red (mutation
checked). No new environment name; no secret, address or host committed. The real send stays an owner step under
`## Before the next release`.

Verdict: ready.
