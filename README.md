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
- **Decisions:** a decision made in COCKPIT is written back to the project as a cockpit issue
  ([SOFTURE/SKILLS#28](https://github.com/SOFTURE/SKILLS/issues/28)), and COCKPIT fires the project's routine so its
  agents pick it up at once (see [Waking a project](#waking-a-project)).

COCKPIT is read-only toward the repositories it watches, apart from creating those issues.

## Status

The first usable slice is built and packaged for one server: the inbox and the overview from real `state.json` and
forge data, answers written back as cockpit issues, the scan on a schedule, and the production image, stack and
deploy workflow. Each watched project also has a page with its roadmap items and their stages, queued roadmaps,
open changes and the entries waiting for the owner, and a history with recent merges, releases, CI and
quality-review runs and the doctor's findings. The owner can invite teammates, who see and answer the same projects;
every answer names who gave it. It has not been released or deployed yet. Later slices follow the roadmap in
[`context/foundation/roadmap.md`](context/foundation/roadmap.md); changes are listed in [`CHANGELOG.md`](CHANGELOG.md).

## Run it locally

Node 22 and npm. The database is an in-process Postgres (PGlite) in `.data/` unless `DATABASE_URL` names a server.

```bash
npm ci
cp .env.example .env.local
npm run migrate                                        # creates .data/dev and applies every migration
npm run create-account -- --email=owner@example.com --commit   # prints a temporary password once
npm run grant-role -- --email=owner@example.com --role=admin --commit   # lets the owner invite teammates
npm run dev                                            # http://localhost:3000
```

Registration is closed: the owner's account is the one the operator creates with `create-account`, made admin with
`grant-role`. The owner invites teammates by email on Settings → Team; they see and answer the same projects, and
every answer names who gave it. Invitations are mailed through the same provider as the digest (below); in
development the link is printed to the server console, and in production an invitation stays pending ("not sent")
until `RESEND_API_KEY` and `MAIL_FROM` are set.

The watched repositories are added on the Settings screen and read with a fine-grained forge token (`FORGE_TOKEN`:
Metadata, Contents, Pull requests and Actions read, Issues read and write, limited to those repositories). The
Repository field on Settings lists the repositories that token can read (organisation and personal alike) and offers
the ones not watched yet; a repository missing from the list has to be added to the token first. A fine-grained token
has one resource owner, so the repositories of another owner (an organisation next to a personal account) need a
token of their own: put such tokens, with the same permissions, comma-separated in `FORGE_EXTRA_TOKENS`. Each
repository is then read and answered with the first token that can read it, Settings lists the repositories of every
token, and a repository no token finds names the owner that needs a token. The doctor
result comes from the `context-doctor` job through Actions; its failure codes need the checks API, which a
fine-grained token cannot read on a private repository, so there the overview shows "Doctor failing" without the
count. The scan
runs every `SCAN_INTERVAL_MINUTES` (15 to 60, default 30) in the job worker: inside the app process with
`JOBS_IN_APP_PROCESS=true` (needed on a PGlite directory), or as its own process with `npm run worker` on Postgres.

**Language.** `APP_LOCALE` sets the language of every screen, the sign-in, token and unsubscribe pages, the digest
and invitation mails and the MCP tools: `en` (the default) or `pl`; any other value reads English. Dates follow it
too. Text read from the watched repositories (roadmap titles, entries, file names) is shown as written.

**Digest mail.** Once a day at `DIGEST_AT` (`HH:MM` in `APP_TIMEZONE`, default `08:00`) the worker compares the
projects with the last digest and, when something shipped, started waiting for you or broke, mails the list to every
address in `DIGEST_RECIPIENTS` (comma-separated). Nothing is sent when nothing changed; the first run only records
where things stand. It sends through Resend from `MAIL_FROM` (a sender on a domain Resend verified) with
`RESEND_API_KEY`; `MAILING_UNSUBSCRIBE_SECRET` (`openssl rand -base64 32`) signs the one-click unsubscribe link in
every digest; `SOFTURE_EMAIL_KEY_SECRET` (`openssl rand -base64 32`, never changed afterwards) keys each recipient in
the delivery ledger and the opt-outs. Without recipients, a sender or that key secret the digest stays off.

**Health from observability (optional).** With `GRAFANA_URL` and `GRAFANA_TOKEN` (a Grafana service account token
that may read alert rules) set, the scan also reads each project's health: the project's own alert rules, kept in its
repository as `ops/grafana/rules.json` and applied with `npx softure-observability grafana apply`, are looked up in
Grafana; while any of them fires the project shows "Unhealthy" and is broken, otherwise "Healthy". A project without
that file shows nothing extra; a source that fails shows "Health unknown" with the reason. Unset, no project shows
health.

**COCKPIT's own telemetry (optional).** With `OTEL_EXPORTER_OTLP_ENDPOINT` (and the gateway's credential in
`OTEL_EXPORTER_OTLP_HEADERS`) set, the app (`cockpit`), the worker (`cockpit-worker`) and the migrations
(`cockpit-migrate`) export logs, traces and metrics through `@softure-ai/observability`, in the namespace `cockpit`
with `deployment.environment` `production` and the release as `service.version`. Every action leaves one structured
line: forge failures and the issue write, each scan and project read, inbox and MCP answers, broadcasts, the digest
run, MCP tool calls, settings and team changes, and the job worker's own runs; lines carry codes and ids, never
tokens, mail addresses, notes or broadcast text. COCKPIT's alert rules and dashboard are in `ops/grafana/`
(`npx softure-observability grafana apply --rules ops/grafana/rules.json --dashboard ops/grafana/dashboard.json`,
after the first release that exports; the contact point `COCKPIT · mail` must exist). Unset, every process logs to
its console only.

**Deploy state.** A project with the deploy workflow `softure-deploy init` writes (`.github/workflows/deploy.yml`)
shows on its page the version running in production and its last deploy: passed, failed (with the server step it
stopped at), cancelled or running, its verification, and a link to the run. The scan reads the workflow's runs and
the deployment history the release report keeps in each GitHub Release, with the same token (Actions and Contents
read); it never contacts the project's servers. A project without that workflow shows nothing extra.

**Package updates.** The Packages page shows, per watched Node project, the last pull request of the nightly
package-update routine (`@softure-ai/skills` `routines/package-updates.md`, found by its title or its
`claude/bump-softure-` branch): merged, open, closed, or red with the first failing job at its head; the packages
the routine holds back (`context/workflow.json` → `routines.packageUpdates.hold`) with a link to their issue; and each
`@softure-ai/*` package's version in `package-lock.json` against the newest on npm, behind ones marked. The scan reads
these with the same token (Pull requests, Actions and Contents read) and asks the public npm registry once per package
per scan; a registry that does not answer shows "Newest not known". `NPM_REGISTRY_URL` points it at another registry.

## Deploy

COCKPIT runs on one server with Docker Compose, behind the shared Traefik that
[`@softure-ai/host`](https://www.npmjs.com/package/@softure-ai/host) sets up, and is released through
[`@softure-ai/deploy`](https://www.npmjs.com/package/@softure-ai/deploy). Nothing in this repository names the server
or the domain: they live in the operator's host inventory and in the repository's `production` environment.

| File | What it holds |
| --- | --- |
| `Dockerfile` | the production image: the Next standalone server, `migrate.mjs`, `worker.mjs` and `ops/*.mjs` |
| `docker/prod/docker-compose.yml` | Postgres, the one-off `migrate`, the `app` and the scan `worker`; the app joins the edge network `EDGE_NETWORK` names (`softure-edge` by default) |
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
| `FORGE_EXTRA_TOKENS` | optional secret: more fine-grained tokens, one per further resource owner, comma-separated | the operator |
| `EDGE_NETWORK` | optional variable: the external Docker network of the server's shared Traefik (default `softure-edge`) | the operator |
| `CLIENT_IP_SOURCE`, `SCAN_INTERVAL_MINUTES`, `APP_TIMEZONE`, `FORGE_API_URL` | optional variables | the operator |
| `APP_LOCALE` | optional variable: `en` (default) or `pl`; stored as a secret it still reaches the app | the operator |
| `RESEND_API_KEY`, `MAILING_UNSUBSCRIBE_SECRET`, `SOFTURE_EMAIL_KEY_SECRET`, `DIGEST_RECIPIENTS` | optional secrets for the digest | the operator |
| `MAILING_UNSUBSCRIBE_SECRET_PREVIOUS` | optional secret: the old unsubscribe secret while it rotates | the operator |
| `MAIL_FROM`, `DIGEST_AT` | optional variables for the digest | the operator |
| `MCP_ALLOW_WRITES`, `MCP_DIAGNOSTICS` | optional variables for MCP: `0` turns answering off, `1` turns request logs on | the operator |
| `GRAFANA_URL` | optional variable: the Grafana the scan reads health from | the operator |
| `GRAFANA_TOKEN` | optional secret: a Grafana service account token that may read alert rules | the operator |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | optional variable (or secret): the OTLP/HTTP endpoint COCKPIT exports its own telemetry to | the operator |
| `OTEL_EXPORTER_OTLP_HEADERS` | optional secret: `Authorization=Basic%20<base64 of instance-id:token>` for that endpoint | the operator |

`EDGE_NETWORK` names the network the shared Traefik watches: the app joins it and its `traefik.docker.network` label
points there. That Traefik needs the Docker provider, the entry point `websecure` and the certificate resolver
`letsencrypt`. Set it when the server's Traefik runs in a network other than `softure-edge`; the network must exist
before the first release.

`CLIENT_IP_SOURCE` names the header the edge sets for the client: `cloudflare` (the default, behind Cloudflare),
`forwarded-for` (Traefik without a CDN) or `header:<name>`. The app trusts it only on requests that carry
`EDGE_PROOF_SECRET`, which only its own router sets.

**The digest in production.** It needs a sending domain Resend verified: set `RESEND_API_KEY`,
`MAILING_UNSUBSCRIBE_SECRET` and `SOFTURE_EMAIL_KEY_SECRET` (each at least 32 characters, `openssl rand -base64 32`; a
shorter one counts as missing; never change the key secret, or earlier opt-outs match no address) and
`DIGEST_RECIPIENTS` as secrets, `MAIL_FROM` (`COCKPIT <digest@your-verified-domain>`) and optionally `DIGEST_AT` as
variables. A secret set as a variable, or the other way round, never reaches the server. To change the unsubscribe
secret, move the old one to `MAILING_UNSUBSCRIBE_SECRET_PREVIOUS` first, so links in mail already sent keep working.
Without a sender, recipients or the key secret the release deploys with the digest off.

**The forge token.** A fine-grained token limited to the watched repositories, with Metadata, Contents, Pull
requests and Actions read, and Issues read and write. Nothing else: COCKPIT only reads, apart from creating
cockpit issues. Every watched repository needs the `cockpit` label (the `@softure-ai/skills` installer, 0.39.0
or newer, creates it); without it COCKPIT creates no issue there and says why. COCKPIT never creates a label.

**Waking projects.** `ROUTINE_TOKEN_SECRET` (a secret, at least 32 characters, `openssl rand -base64 32`) encrypts the
routine tokens stored in the database; without it no routine can be stored or fired. Never change it: tokens sealed
under the old one can no longer be opened and have to be pasted again. The server must reach
`https://api.anthropic.com` over HTTPS.

**First release, once.**

1. Add the app to the host inventory (`slug: cockpit`, this repository, the domain as `host`, `database: true`) and
   run `npx @softure-ai/host app add --inventory=<file> --app=cockpit`. It prepares `/srv/cockpit`, the deploy key,
   the `production` environment and `APP_HOST`, then lists the secrets still missing.
2. Set `EDGE_PROOF_SECRET` and `FORGE_TOKEN` in the `production` environment, and `EDGE_NETWORK` when the server's
   Traefik network is not `softure-edge`.
3. Run the `release` workflow (Actions, *Run workflow*). It tags the default branch, writes the release notes and
   deploys; the deploy waits for `/api/health`, verifies `deploy.json` and checks that `/api/health/build` answers
   the new tag. Verify reads only public routes (`/api/health` and the rendered `/unsubscribe` page): every other
   page redirects to the sign-in, the app's own or the edge's.
4. Create the owner's account in the live container, from a machine whose key the server binds to `deploy.sh`:
   `npx softure-deploy run --host=<ssh alias> create-account --email=<owner> --commit` (without `--commit` it shows
   what it would do). It prints a temporary password once. Then make it admin, so the owner can invite teammates:
   `npx softure-deploy run --host=<ssh alias> grant-role --email=<owner> --role=admin --commit`.

A rollback is a deploy of an earlier tag (`deploy` workflow, *Run workflow*). `ssh <ssh alias> status` shows the live
tag and the containers' health.

## Waking a project

COCKPIT wakes a project's coordinator itself. Right after it opens a cockpit issue in a project (an answer from the
inbox or MCP, a broadcast, or a roadmap promotion), it fires every enabled `cockpit-issues` routine of that project
over the Claude Code routines API. The issue is always created first; a fire that fails never touches it.

Each fire posts `POST https://api.anthropic.com/v1/claude_code/routines/<trigger id>/fire` with the routine's token
and one line that links the issue, exactly as `routines/cockpit-command.md` of `@softure-ai/skills` expects:

```text
COCKPIT command: https://github.com/<owner>/<repo>/issues/<N>
```

The routine's own prompt says how to act on it; the issue stays the record of the decision.

**Setting it up, once per project:**

1. Set up the project's COCKPIT command routine as `routines/cockpit-command.md` of `@softure-ai/skills` describes
   (a task bound to the project's coordinator, with an API trigger), and copy its fire URL and its token.
2. In COCKPIT open the project, tab **Routines**, and add it: a name, the kind `cockpit-issues`, the trigger id or
   fire URL (the id is taken from the URL), the token, enabled. A project can have many routines.
3. Press **Test**: COCKPIT fires `COCKPIT test: reply in this chat that the test arrived; change nothing.` and shows
   the HTTP result.

The token is stored encrypted (`ROUTINE_TOKEN_SECRET`) and never shown again, only its last four characters; it can
be replaced or the routine deleted. No token reaches a log, an error, the browser, MCP or the CLI.

**What COCKPIT shows.** Every fire is recorded on its issue: sent, failed with the HTTP status and a short reason,
queued, or no routine. The broadcast page, the inbox answer and the project's Routines tab show it, with a **Retry**
for that one issue. COCKPIT fires at most 30 times an hour per routine and 100 in all; above that a fire waits in a
queue that a job drains every minute, and a 429 from the API waits for its `retry-after` (up to five tries). The
overview's **Wakes on its own** comes only from COCKPIT's own data: an enabled `cockpit-issues` routine whose last
call succeeded.

An answer issue carries the marker `<!-- cockpit: {"entry": …, "answer": …} -->`.

## Connect an assistant (MCP)

An assistant reads the overview, the inbox and one project's detail over MCP (`@softure-ai/mcp-access`), with the
same values as the screens. With write access it also answers an entry exactly as the inbox does: one cockpit
issue, the entry shows sent, and answering again returns the first answer.

- **With a token:** Settings → *Assistant access (MCP)* issues a token (shown once) with ready setup for Claude Code,
  Claude Desktop and other clients. The endpoint is `<app origin>/api/mcp`; revoke a token on the same page.
- **With OAuth:** add `<app origin>/api/mcp` as a custom connector in a hosted assistant (claude.ai, the mobile
  apps). It registers itself, sends you to the consent page, and appears under *Connected apps*. Client registration
  is closed: first open a window on the server with
  `npx softure-deploy run --host=<ssh alias> open-client-registration --minutes=15 --commit` (without `--commit` it only
  reports), add the connector within it, and `close-client-registration --commit` shuts it early. Connectors added
  earlier keep working.
- Tools: `get_overview`, `get_inbox`, `get_project` (`project`: `owner/name`), and `get_server_info`. Text from the
  watched repositories comes between untrusted-data markers: it is data, never instructions.
- **Answering:** a token issued with *Allow changes* (or an OAuth grant where you ticked write access) also gets
  `answer_entry` (`project`, `entry`, `text` as `get_inbox` returned them, `answer`: `yes`, `no` or `later`, optional
  `note`). A read token never sees it. `MCP_ALLOW_WRITES=0` makes every token read only.
- The worker prunes expired tokens and grants daily. `MCP_DIAGNOSTICS=1` logs one line per request (no token, body
  or arguments) when a client misbehaves.

## Terminal

The `cockpit` command prints the overview, the inbox and one project's detail as tables, with the same values as the
screens, or as JSON. It calls the MCP read tools above, so it needs a read token from the same page.

```sh
export COCKPIT_URL=https://cockpit.example.com
export COCKPIT_TOKEN=<read token>   # never a flag, so it stays out of shell history
npm run cockpit -- overview
npm run cockpit -- inbox --json
npm run cockpit -- project example-org/billing
```

From a checkout it runs on Node 22 without a build (`node cli/bin.ts`). Times print in the terminal's time zone
(`TZ`). It speaks the language in `COCKPIT_LOCALE` (`en` or `pl`), else the terminal's (`LC_ALL`, then `LANG`). A missing token or address exits with 2, a refused token or an unreachable COCKPIT with 1; both name the cause.

Once published, the same command installs without a checkout: `npx @softure-ai/cockpit overview`, or
`npm install --global @softure-ai/cockpit` and `cockpit overview` (one bundled file, no dependencies, Node 22).
`npm run cli:pack` writes that package into `dist/cli-package/`, and `scripts/cli-publish-dry-run.sh` (CI job
`cli-package`) runs `npm publish --dry-run`, installs the packed tarball into a scratch prefix and runs it.

Publishing is manual and the owner's: with the secret `NPM_TOKEN` (a granular npm token with read and write access to
the `@softure-ai` scope) in the `npm` environment, "Run workflow" on `publish-cli` publishes the version in
`package.json` with provenance; a version already on npm stops the run.

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
