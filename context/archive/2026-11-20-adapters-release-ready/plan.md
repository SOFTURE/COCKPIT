# Plan: adapters-release-ready

## Goal
The adapters slice is ready to release: production passes the observability settings to the worker, the release
carries the token by name, the dry run checks they arrive, the version and release notes list CMP-21 and CMP-22.
Nothing is tagged, released or deployed (owner's word).

## Approach
**Chosen:** optional names (`${NAME:-}`) in the worker's environment only; `GRAFANA_TOKEN` an optional secret by name
in `deploy.yml`, `GRAFANA_URL` a variable through `app-vars`; version `0.5.0` with its own changelog section.
Rejected: passing both to the app as well (the app never reads them; a secret goes only where it is used).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Required or optional | optional, empty by default | health is opt-in; the release never stops on it | research |
| Services | worker only | only the worker runs the scan and its adapters | research (`scripts/worker.ts`) |
| Secret | `GRAFANA_TOKEN` | a token stays masked | deploy workflow |
| Variable | `GRAFANA_URL` | a public setting, through `app-vars` | deploy workflow |
| Deploy adapter | nothing new | it reads with `FORGE_TOKEN` | research |
| Version | `0.5.0`, `CHANGELOG.md` section `0.5.0 (unreleased)` listing CMP-21 to CMP-23 | one version per slice; 0.3.0 and 0.4.0 are taken by open release items | research |

## Phase 1: Adapter settings in production, version and notes
**Discipline:** TDD (the stack test first). **Files:** `docker/prod/docker-compose.yml`,
`.github/workflows/deploy.yml`, `scripts/deploy-dry-run.sh`, `tests/deploy/production-stack.test.ts`,
`package.json`, `package-lock.json` (version), `CHANGELOG.md`, `README.md` (production environment table),
`context/foundation/roadmap.md` (owner step wording).

**Tests:** `tests/deploy/production-stack.test.ts`: the worker reads `GRAFANA_URL` and `GRAFANA_TOKEN`, both optional
and empty by default; the app reads neither; `GRAFANA_TOKEN` is in `secret-names` with its `env:` line,
`GRAFANA_URL` is not; the required list is unchanged. The dry run renders fictional values and checks the worker's
environment carries them and the app's does not.

**Done when:**
- Automated: the stack test passes and fails when a Grafana name is dropped from the worker (mutation checked).
- Automated: Gates green (typecheck, lint, test).
- Automated: `deploy-dry-run` green on the pull request, with the adapter settings checked.
- Automated: `context-doctor` green.

## Risks and rollback
- Health in production needs the owner's Grafana URL and token: listed under `## Before the next release` (CMP-21).
- Rollback: revert the merge; nothing runs outside CI.

## Decisions (auto)
- Worker only (above); the roadmap's CMP-21 owner step is reworded from "the app and the worker" to "the worker".
- Version 0.5.0 (above); if the main branch holds another version at merge time, take the next free one.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Adapter settings in production, version and notes

#### Automated
- [x] 1.1 Stack test passes; dropping a Grafana name from the worker turns it red — 7b369c2
- [x] 1.2 Gates green (typecheck, lint, test) — 7b369c2
- [x] 1.3 Deploy dry run green with the adapter settings checked (PR #30, run 45154974448: "worker: GRAFANA_URL and GRAFANA_TOKEN set", "app: no observability settings") — 7b369c2
- [x] 1.4 `context-doctor` green (PR #30, run 45154974448) — 7b369c2
