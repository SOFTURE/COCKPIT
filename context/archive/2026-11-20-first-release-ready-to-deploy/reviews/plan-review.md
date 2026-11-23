# Plan review: first-release-ready-to-deploy

Reviewed against change.md, research.md, the PRD (FR-9, NFR-5, NFR-6), AGENTS.md and the code on master c412136.

| # | Severity | Finding | Decision |
| --- | --- | --- | --- |
| 1 | CRITICAL | init writes the domain into the compose file and the workflow; AGENTS.md keeps hosts out of the repository. | Fix: `APP_HOST` variable in both places; a test fails on a literal host. |
| 2 | WARNING | init publishes Postgres on `127.0.0.1:5432`, which another app on the shared host may hold. | Fix: drop the port, `database.access: compose-exec`; guarded by `checkSharedHostCompose`. |
| 3 | WARNING | The repository's `scripts/worker.ts` has no health file, so the worker's compose health check would never pass. | Fix: pass `healthFile`; the dry run proves it. |
| 4 | WARNING | A secret added to the compose file but not to `deploy.yml` stops the first release on the server's side. | Fix: a test compares the required names with `secret-names`. |
| 5 | SUGGESTION | The first account has no way to be created in the container (`tsx` is not in the image). | Applied: `scripts/ops/create-account.ts`, run through `deploy.sh run`. |
| 6 | SUGGESTION | `SCAN_INTERVAL_MINUTES`, `APP_TIMEZONE`, `CLIENT_IP_SOURCE` would be lost in production. | Applied: optional `${NAME:-default}` entries. |

Verdict: ready to implement after the fixes above (applied to the plan).
