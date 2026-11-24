# Implementation review: bump-softure-packages-2026-11-24

Scope: full · Date: 2026-11-24 · Commits: c7338f7 · Gates: typecheck ✓ lint ✓ test ✓ (428/428) doctor ✓ e2e ✓

## Verdict
Ready. Every moving `@softure-ai/*` package is on its newest version and every SOFTURE pin follows
(`deploy@0.7.9`, CI's doctor on skills 0.34.0). The mailing 0.3.0 break is absorbed in the app: without
`SOFTURE_EMAIL_KEY_SECRET` the digest counts as not configured instead of throwing inside a delivery, and the secret
reaches both services exactly like the unsubscribe secret (compose, workflow env, `secret-names`, dry run). The
stack tests hold `publicPaths` equal to the guard's `PUBLIC_PATHS` and the pins equal to the locked deploy version.

## Dimensions
| Dimension | Verdict | Findings |
|---|---|---|
| Plan adherence | PASS | |
| Scope | PASS | only the bump, its adaptations, docs and the CMP-12 owner step text |
| Progress honesty | PASS | red runs recorded before each fix; the e2e rerun is named |
| Correctness | PASS | |
| Tests | PASS | |
| Security | PASS | the new secret is optional, never logged; fixtures fictional; no new public path |

## Findings
None.

## Decisions (auto)
- The local `PageLayout` stays as a thin adapter over the theme's, so no screen changes its props.
- Mailing migration `0006` runs with the next release's `softure migrate`; the digest has never sent in production, so
  no stored keys are lost.
