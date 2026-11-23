# Implementation review: first-release-ready-to-deploy

Reviewed the diff 603a5a5..9e26596 against plan.md, change.md, the PRD (FR-9, NFR-5, NFR-6) and AGENTS.md.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | WARNING | `scripts/deploy-dry-run.sh` gained `DRY_RUN_IMAGE_BUILT=1`, a branch CI never takes. | Accept: a builder behind its own proxy (this session) needs it; the stack part is the same either way and CI builds the image itself. |
| 2 | SUGGESTION | `npm install --package-lock-only` normalised `dev: true` on esbuild's platform packages in the lock file. | Accept: npm's own normalisation, no version changed. |
| 4 | CRITICAL | The root `.gitignore`'s `build/` kept `app/api/health/build/route.ts` out of git; the deploy's smoke check would have failed on the first release. Found by the CI dry run. | Fixed in 9e26596: the pattern is anchored to the root. |
| 3 | SUGGESTION | The worker's health file path is fixed to `/tmp/softure-jobs-worker.alive` also for `npm run worker` locally. | Accept: matches init's template and the compose health check; harmless locally. |

Drift from plan: none. Tests: the compose guard and the secret-name test fail on a published Postgres port and on an
unlisted required secret (mutation checked); the client-IP test covers unset, empty, missing, wrong and right proof.
Security: no secret or host committed; secrets reach the deploy step by name only; the app trusts client-IP headers
only behind the edge proof.

Verdict: ready.
