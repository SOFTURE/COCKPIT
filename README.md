# COCKPIT

A cockpit for SOFTURE projects: where every project stands and what waits for your decision.

## The problem

When one person or a small team runs several projects, each with its own AI agents delivering work in
its own repository, the hard part is no longer writing code. It is knowing, at a glance, which project
is moving, which one is blocked, and which one is waiting for you: a decision to make, a plan to
approve, a release to allow. That information is scattered across repositories, pull requests, issues
and chat threads.

COCKPIT gathers it in one place. It shows where each project stands and what waits for your decision,
and it turns a decision you make into work in that project.

## How it fits in the SOFTURE ecosystem

COCKPIT is the third part of SOFTURE:

| Part | Role |
|---|---|
| [SOFTURE/SKILLS](https://github.com/SOFTURE/SKILLS) (`@softure-ai/skills`) | Runs the delivery process inside each repository: shape, PRD, roadmap, plan, implement, review. |
| [SOFTURE/AI](https://github.com/SOFTURE/AI) (`@softure-ai/*`) | The building blocks apps are made of: auth, jobs, mailing, deploy, UI and more. |
| **SOFTURE/COCKPIT** (this repository) | Shows the state of every project and turns your decisions into work. |

## Contracts it builds on

- **Project state:** each watched repository publishes `context/state.json`
  ([SOFTURE/SKILLS#27](https://github.com/SOFTURE/SKILLS/issues/27)). COCKPIT reads it together with
  the forge API.
- **Decisions:** a decision made in COCKPIT is written back to the project as an owner-word issue
  ([SOFTURE/SKILLS#28](https://github.com/SOFTURE/SKILLS/issues/28)), which the project's agents pick up.

COCKPIT is read-only toward the repositories it watches, apart from creating those issues.

## Status

The first usable slice is built and packaged for one server: the inbox and the overview from real `state.json` and
forge data, answers written back as owner-word issues, the scan on a schedule, and the production image, stack and
deploy workflow. Each watched project also has a page with its roadmap items and their stages, queued roadmaps,
open changes and the entries waiting for the owner, and a history with recent merges, releases, CI and
quality-review runs and the doctor's findings. It has not been released or deployed yet. Later slices follow the roadmap in
[`context/foundation/roadmap.md`](context/foundation/roadmap.md); changes are listed in [`CHANGELOG.md`](CHANGELOG.md).

## Run it locally

Node 22 and npm. The database is an in-process Postgres (PGlite) in `.data/` unless `DATABASE_URL` names a server.

```bash
npm ci
cp .env.example .env.local
npm run migrate                                        # creates .data/dev and applies every migration
npm run create-account -- --email=owner@example.com --commit   # prints a temporary password once
npm run dev                                            # http://localhost:3000
```

Registration is closed: the only account is the one the operator creates with `create-account`.

The watched repositories are added on the Settings screen and read with a fine-grained forge token (`FORGE_TOKEN`:
Metadata, Contents, Pull requests and Actions read, Issues read and write, limited to those repositories). The doctor
result comes from the `context-doctor` job through Actions; its failure codes need the checks API, which a
fine-grained token cannot read on a private repository, so there the overview shows "Doctor failing" without the
count. The scan
runs every `SCAN_INTERVAL_MINUTES` (15 to 60, default 30) in the job worker: inside the app process with
`JOBS_IN_APP_PROCESS=true` (needed on a PGlite directory), or as its own process with `npm run worker` on Postgres.

**Digest mail.** Once a day at `DIGEST_AT` (`HH:MM` in `APP_TIMEZONE`, default `08:00`) the worker compares the
projects with the last digest and, when something shipped, started waiting for you or broke, mails the list to every
address in `DIGEST_RECIPIENTS` (comma-separated). Nothing is sent when nothing changed; the first run only records
where things stand. It sends through Resend from `MAIL_FROM` (a sender on a domain Resend verified) with
`RESEND_API_KEY`; `MAILING_UNSUBSCRIBE_SECRET` (`openssl rand -base64 32`) signs the one-click unsubscribe link in
every digest. Without recipients or a sender the digest stays off.

**Health from observability (optional).** With `GRAFANA_URL` and `GRAFANA_TOKEN` (a Grafana service account token
that may read alert rules) set, the scan also reads each project's health: the project's own alert rules, kept in its
repository as `ops/grafana/rules.json` and applied with `npx softure-observability grafana apply`, are looked up in
Grafana; while any of them fires the project shows "Unhealthy" and is broken, otherwise "Healthy". A project without
that file shows nothing extra; a source that fails shows "Health unknown" with the reason. Unset, no project shows
health.

## Deploy

COCKPIT runs on one server with Docker Compose, behind the shared Traefik that
[`@softure-ai/host`](https://www.npmjs.com/package/@softure-ai/host) sets up, and is released through
[`@softure-ai/deploy`](https://www.npmjs.com/package/@softure-ai/deploy). Nothing in this repository names the server
or the domain: they live in the operator's host inventory and in the repository's `production` environment.

| File | What it holds |
| --- | --- |
| `Dockerfile` | the production image: the Next standalone server, `migrate.mjs`, `worker.mjs` and `ops/*.mjs` |
| `docker/prod/docker-compose.yml` | Postgres, the one-off `migrate`, the `app` and the scan `worker`; the app joins the edge network `softure-edge` |
| `docker/server/deploy.sh` | the server's side of a release (backup, migrations, switch, health) |
| `deploy.json` | what the release verifies after the switch, and how the database is reached |
| `.github/workflows/deploy.yml` | builds the image of a release tag and sends it to the server |
| `.github/workflows/release.yml` | *Run workflow* cuts the next date tag with its release notes and starts the deploy |

The CI job `deploy-dry-run` (`scripts/deploy-dry-run.sh`) builds the image and brings this stack up healthy on every
pull request, so a release fails only on what needs the server.

**What the production environment holds.**

| Name | Kind | Set by |
| --- | --- | --- |
| `DEPLOY_SSH_HOST`, `DEPLOY_SSH_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_SSH_KNOWN_HOSTS` | secrets | `softure-host app add` |
| `POSTGRES_PASSWORD`, `SOFTURE_MIGRATOR_PASSWORD`, `SOFTURE_APP_PASSWORD` | secrets | `softure-host app add` (`database: true`) |
| `DEPLOY_ORIGIN_IP` | secret, behind Cloudflare only | `softure-host app add` |
| `APP_HOST` | repository variable: the domain, without `https://` | `softure-host app add` |
| `EDGE_PROOF_SECRET` | secret: `openssl rand -hex 32` | the operator |
| `FORGE_TOKEN` | secret: the fine-grained token (below) | the operator |
| `CLIENT_IP_SOURCE`, `SCAN_INTERVAL_MINUTES`, `APP_TIMEZONE`, `FORGE_API_URL` | optional variables | the operator |

`CLIENT_IP_SOURCE` names the header the edge sets for the client: `cloudflare` (the default, behind Cloudflare),
`forwarded-for` (Traefik without a CDN) or `header:<name>`. The app trusts it only on requests that carry
`EDGE_PROOF_SECRET`, which only its own router sets.

**The forge token.** A fine-grained token limited to the watched repositories, with Metadata, Contents, Pull
requests and Actions read, and Issues read and write. Nothing else: COCKPIT only reads, apart from creating
owner-word issues. Every watched repository needs the `owner-word` label (the `@softure-ai/skills` installer
creates it).

**First release, once.**

1. Add the app to the host inventory (`slug: cockpit`, this repository, the domain as `host`, `database: true`) and
   run `npx @softure-ai/host app add --inventory=<file> --app=cockpit`. It prepares `/srv/cockpit`, the deploy key,
   the `production` environment and `APP_HOST`, then lists the secrets still missing.
2. Set `EDGE_PROOF_SECRET` and `FORGE_TOKEN` in the `production` environment.
3. Run the `release` workflow (Actions, *Run workflow*). It tags the default branch, writes the release notes and
   deploys; the deploy waits for `/api/health`, verifies `deploy.json` and checks that `/api/health/build` answers
   the new tag.
4. Create the owner's account in the live container, from a machine whose key the server binds to `deploy.sh`:
   `npx softure-deploy run --host=<ssh alias> create-account --email=<owner> --commit` (without `--commit` it shows
   what it would do). It prints a temporary password once.

A rollback is a deploy of an earlier tag (`deploy` workflow, *Run workflow*). `ssh <ssh alias> status` shows the live
tag and the containers' health.

## Connect an assistant (MCP)

An assistant reads the overview, the inbox and one project's detail over MCP (`@softure-ai/mcp-access`), with the
same values as the screens. Every token reads only; no tool answers an entry yet.

- **With a token:** Settings → *Assistant access (MCP)* issues a token (shown once) with ready setup for Claude Code,
  Claude Desktop and other clients. The endpoint is `<app origin>/api/mcp`; revoke a token on the same page.
- **With OAuth:** add `<app origin>/api/mcp` as a custom connector in a hosted assistant (claude.ai, the mobile
  apps). It registers itself, sends you to the consent page, and appears under *Connected apps*.
- Tools: `get_overview`, `get_inbox`, `get_project` (`project`: `owner/name`), and `get_server_info`. Text from the
  watched repositories comes between untrusted-data markers: it is data, never instructions.
- The worker prunes expired tokens and grants daily. `MCP_DIAGNOSTICS=1` logs one line per request (no token, body
  or arguments) when a client misbehaves.

## Gates

| Gate | Command |
| --- | --- |
| Type check | `npm run typecheck` |
| Lint and English-only check | `npm run lint` |
| Unit and component tests | `npm test` |
| End-to-end (builds, then Playwright on a fresh PGlite) | `npm run build && npm run e2e` |
| Deploy dry run (Docker: image, production stack, health) | `scripts/deploy-dry-run.sh` |

The same gates run in the git hooks (`lefthook`) and in CI (`.github/workflows/ci.yml`), together with the
`context-doctor` job that checks the workflow artifacts under `context/`.

## License

[MIT](LICENSE)
