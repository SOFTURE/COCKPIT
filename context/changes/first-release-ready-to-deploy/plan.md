# Plan: first-release-ready-to-deploy

## Goal
The first usable slice is packaged for one server through `@softure-ai/deploy` and `@softure-ai/host`: container,
production stack, deploy and release workflows, the secret names, health and build info verification, release notes
and the operator section. A dry run in CI builds the image and brings the production stack up healthy. Nothing is
tagged, released or deployed (owner's word).

## Approach
**Chosen:** run `softure-deploy init --edge=softure-edge --env=FORGE_TOKEN` and adopt its files, then adapt them:
the domain becomes the variable `APP_HOST`, the Postgres loopback port goes (`database.access: compose-exec`), the
worker loop gets its health file, the optional runtime settings pass through, the app wraps its client-IP resolver
in `edgeProofIp`, and a `deploy-dry-run` CI job proves the stack.
Rejected: a hand-written Dockerfile and workflow (the package owns those steps); a Traefik of our own (the host's
shared edge serves every app).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Ingress | `--edge=softure-edge` | `@softure-ai/host` default edge | host README |
| Domain | `${APP_HOST:?}` in compose, `vars.APP_HOST` in the workflow | never committed; `app add` sets it | AGENTS.md, host README |
| Database access | `compose-exec`, no published port | shared host guard | deploy README |
| Workflows | `deploy.yml`, `release.yml`; not `checks.yml`, `release-notes.yml` | `ci.yml` already runs the gates; notes edit is optional | roadmap lane R |
| First account | `scripts/ops/create-account.ts` | `deploy.sh run create-account` | deploy README |
| Version | `0.1.0` in `package.json`, `CHANGELOG.md` with an unreleased 0.1.0 | release notes without a tag | change.md |

## Phase 1: Container and production stack
**Discipline:** test-after (configuration). **Files:** `Dockerfile`, `.dockerignore`, `docker/prod/**`,
`docker/server/deploy.sh`, `deploy.json`, `scripts/worker.ts`, `scripts/ops/create-account.ts`,
`app/api/health/build/route.ts`, `softure.config.ts`, `package.json` (`@softure-ai/deploy` dev dependency),
`tests/deploy/**`.

**Tests:** `tests/deploy/production-compose.test.ts`: `checkSharedHostCompose` passes for `softure-edge` and prefix
`cockpit`; every required name of the compose file is in `deploy.yml`'s `secret-names` or is `APP_HOST`, and every
secret name is required; no literal domain. Config test: the client-IP resolver trusts the edge proof.

**Done when:**
- Automated: the tests pass; Gates green (typecheck, lint, test).
- Automated: `docker build` succeeds and `docker compose up --wait` brings `postgres`, `migrate`, `app` and `worker`
  up healthy; `/api/health` answers `"status":"ok"` and `/api/health/build` answers the release (run locally,
  recorded on Progress).

## Phase 2: Workflows, dry run in CI, release notes
**Discipline:** test-after. **Files:** `.github/workflows/deploy.yml`, `.github/workflows/release.yml`,
`.github/workflows/ci.yml` (job `deploy-dry-run`), `scripts/deploy-dry-run.sh`, `CHANGELOG.md`, `package.json`
(version), `README.md` (operator section), `.env.example`.

**Done when:**
- Automated: `deploy-dry-run` is green on the pull request (env render with fictional values, image build, stack up,
  health and build info).
- Automated: Gates green; `context-doctor` green.

## Risks and rollback
- The deploy itself is untested until the owner's server exists; `app add` and the first release are the owner's
  steps, listed under Before the next release.
- Rollback: revert the merge; nothing runs outside CI.

## Decisions (auto)
- Edge ingress through the host's shared Traefik, not Cloudflare Tunnel: the owner has not named a CDN; the client-IP
  source stays a runtime switch (`CLIENT_IP_SOURCE`).
- `checks.yml` and `release-notes.yml` not adopted: `ci.yml` covers the checks; notes are edited on the release.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Container and production stack

#### Automated
- [ ] 1.1 Compose guard and secret-name tests pass
- [ ] 1.2 Image builds and the production stack comes up healthy locally (health ok, build info answers)
- [ ] 1.3 Gates green (typecheck, lint, test)

### Phase 2: Workflows, dry run in CI, release notes

#### Automated
- [ ] 2.1 `deploy-dry-run` green on the pull request
- [ ] 2.2 Gates and `context-doctor` green
