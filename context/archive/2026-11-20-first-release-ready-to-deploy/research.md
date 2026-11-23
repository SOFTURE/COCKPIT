# Research: first-release-ready-to-deploy

Read on master c412136 (CMP-1 to CMP-7 merged), with `@softure-ai/deploy` 0.7.8 and `@softure-ai/host` 0.1.3 from npm.

## How things are today
- Next 16 app with `@softure-ai/db` (Postgres in production, PGlite locally), `@softure-ai/jobs` (scan worker),
  `@softure-ai/ops` (`/api/health`), `@softure-ai/security`, `@softure-ai/auth` (closed registration).
- `next.config.ts` already switches to `output: "standalone"` on `BUILD_STANDALONE=1` and wraps the config in
  `withBuildInfo` and `withDatabaseBuild({ host: "vps" })`; no build info route is mounted yet.
- `scripts/migrate.ts`, `scripts/worker.ts`, `scripts/create-account.ts` run through `tsx`; nothing runs them in a
  container. No `Dockerfile`, no compose file, no deploy workflow, no `CHANGELOG.md`; `package.json` is `0.0.0`.
- The client address comes from `clientIpFromEnv(process.env)` (`CLIENT_IP_SOURCE`, Cloudflare by default).
- Runtime settings read from the environment: `DATABASE_URL`, `APP_ORIGIN`, `APP_TIMEZONE`, `FORGE_TOKEN`,
  `FORGE_API_URL`, `SCAN_INTERVAL_MINUTES`, `JOBS_IN_APP_PROCESS`, `ALLOW_UNIDENTIFIED_CLIENTS`.

## What the packages give
- `softure-deploy init` writes the whole deploy description once: `Dockerfile` (standalone build, `migrate.mjs`,
  `worker.mjs`, `ops/<name>.mjs`, non-root, `HEALTHCHECK`), `.dockerignore`, `docker/prod/docker-compose.yml`,
  `docker/prod/initdb/01-roles.sql`, `docker/prod/hooks/lib.sh`, `docker/server/deploy.sh`, `deploy.json`, and the
  callers `.github/workflows/deploy.yml`, `release.yml`, `release-notes.yml`, `checks.yml`. A trial run in a scratch
  copy wrote all of them for this app (database and worker parts detected).
- `--edge=<network>` fits `@softure-ai/host`: its server playbook runs one shared Traefik on the network
  `softure-edge` (default `edge.name`), and `app add` creates the `production` environment, the `DEPLOY_SSH_*`
  secrets, `DEPLOY_ORIGIN_IP`, the three database passwords and the repository variable `APP_HOST`; it then lists the
  compose file's required names the environment still lacks.
- With `--edge`, the router sets `X-Softure-Edge-Proof` from the required secret `EDGE_PROOF_SECRET`; the app wraps
  its resolver in `edgeProofIp` (exported by the installed `@softure-ai/security`), which uses the inner resolver
  unchanged when the secret is unset (local runs, tests).
- `checkSharedHostCompose` (`@softure-ai/deploy/testing`) guards the compose file on a shared host: names prefixed,
  external edge network, no host ports (the Postgres loopback port must go and `database.access` becomes
  `compose-exec`).
- `deploy.sh run <script>` runs `ops/<name>.mjs` in the live app container, so the first account is created on the
  server with `scripts/ops/create-account.ts` (a runner of the existing `createCreateAccountScript`).
- The build info route (`createBuildInfoRoute` of `@softure-ai/ops/next`) lets the deploy's smoke check prove that
  production runs the tag (`build-info-path`).
- SOFTURE/AI's reusable workflows are pinned by commit: `deploy@0.7.8` peels to
  `45535f008cda7b97f593fd53f05dbeb679d2bfdc`.

## What a dry run can prove in CI
Docker is available on GitHub-hosted runners (and in this session). A job can build the image from the
`Dockerfile`, render `.env.prod` from fictional values with `softure-deploy env render` (proves the compose file's
names), start the production compose file with that image on a locally created `softure-edge` network
(`docker compose up --wait`: Postgres with the role script, `migrate`, `app`, `worker` health checks), and ask
`/api/health` and `/api/health/build` from inside the app container. Only the SSH send, TLS and the public verify
need the owner's server and domain.

## Risks
- The domain must not be committed (AGENTS.md: runtime configuration). The compose file takes it from the required
  variable `APP_HOST`, which `app-vars: toJSON(vars)` renders from the repository variable `app add` sets; the
  workflow builds `app-url` from `vars.APP_HOST`.
- The image name is the repository's own (`ghcr.io/softure/cockpit`), as `deploy-app.yml` defaults it.
- `deploy.json` verifies HSTS; the edge Traefik's middleware sets it, so nothing is needed in `next.config.ts`.

## Unknowns answered
- Server and domain (OQ-1): still the owner's; they gate only the deploy step, not this change.
