# Implementation review: projects-of-several-forge-owners-watched

Reviewed: the branch against plan.md @ 2026-11-24. Verdict: ready to archive.
Findings: 0 critical, 0 warning, 2 suggestions.

## Lenses
| Lens | Result |
| --- | --- |
| Drift from plan | PASS (router, token reading, list union, owner-naming error, optional secret in compose and deploy, README, CHANGELOG, e2e) |
| Correctness | PASS (pick by metadata before any repository call, so `hasLabel`'s 404-as-false never comes from a blind token; writes move on only after answers that create nothing) |
| Tests | PASS (router: two owners, own-token writes, one pick per repository, blind label, unreadable, public-repository write, no retry on `unavailable`, budget, non-repository path; union; token parsing; production-stack pins the optional secret in app and worker; e2e adds a second owner's repository from the list) |
| Security | PASS (least privilege unchanged; tokens never logged or put in errors; the one write is still `createIssue`) |
| Deploy | PASS (`FORGE_EXTRA_TOKENS` in the deploy `env:` and `secret-names`, `${FORGE_EXTRA_TOKENS:-}` in app and worker: a deploy without it still runs) |

## Findings
- Suggestion: a repository readable by no token costs one metadata read per token per router. Accepted as is: such a
  repository is only met on Settings or for a watched repository whose token was revoked.
- Suggestion: Settings' unreadable message names the owner but cannot tell a missing repository from one outside every
  token. Accepted as is: the forge answers both with 404.

## Decisions (auto)
- Implementation accepted.
