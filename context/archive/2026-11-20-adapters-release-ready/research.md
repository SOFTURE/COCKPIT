# Research: adapters-release-ready

Read on master f59f416 (CMP-1 to CMP-10, CMP-12 to CMP-15, CMP-21 and CMP-22 merged), with `@softure-ai/deploy`
0.7.8 as installed.

## How things are today
- CMP-21 added the observability adapter (`src/adapters/observability/observability-adapter.ts`): `getGrafanaSource`
  reads `GRAFANA_URL` and `GRAFANA_TOKEN` from the environment; either unset (or blank) turns health off.
- The adapters run only in the scan job (`src/jobs/handlers.ts`), which only the worker registers
  (`scripts/worker.ts`). The app never reads either name: the overview and the project page show what the scan stored.
- CMP-22 added the deploy adapter: it reads the watched project's deploy workflow runs and release reports with the
  forge token already in production (`FORGE_TOKEN`); it needs no new setting.
- Neither Grafana name is in `docker/prod/docker-compose.yml` or `.github/workflows/deploy.yml`, so production can
  never show health (the note in change.md from CMP-21).
- `tests/deploy/production-stack.test.ts` pins the required names and the optional ones per service;
  `scripts/deploy-dry-run.sh` checks the digest settings inside the running stack.
- `package.json` is `0.2.0` on master. Open pull requests take `0.3.0` (CMP-16, #27) and `0.4.0` (CMP-11, #28).

## What the packages give
- `env render`: `${NAME:-}` is optional, written when set and left out otherwise; `app-vars: toJSON(vars)` passes
  repository and environment variables by name; a secret reaches `.env.prod` only when it is in `secret-names` and
  has its `env:` line (deploy workflow comments).

## Framing
`frame` skipped: the outcome is the packaging step the roadmap fixes (version, notes, the adapter settings, dry run);
no competing framing.

## Risks
- Parallel release items (CMP-11, CMP-16, later CMP-18, CMP-20) touch the same files (`package.json`, `CHANGELOG.md`,
  the compose file, `deploy.yml`, the dry run, the stack test): merge the main branch in before merging and take the
  next free version then.
