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

In development: the app shell and the owner's sign-in are in place; watched repositories, the scan, the inbox and
the overview follow the roadmap in [`context/foundation/roadmap.md`](context/foundation/roadmap.md).

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
Metadata, Contents, Pull requests and Actions read, Issues read and write, limited to those repositories). The scan
runs every `SCAN_INTERVAL_MINUTES` (15 to 60, default 30) in the job worker: inside the app process with
`JOBS_IN_APP_PROCESS=true` (needed on a PGlite directory), or as its own process with `npm run worker` on Postgres.

## Gates

| Gate | Command |
| --- | --- |
| Type check | `npm run typecheck` |
| Lint and English-only check | `npm run lint` |
| Unit and component tests | `npm test` |
| End-to-end (builds, then Playwright on a fresh PGlite) | `npm run build && npm run e2e` |

The same gates run in the git hooks (`lefthook`) and in CI (`.github/workflows/ci.yml`), together with the
`context-doctor` job that checks the workflow artifacts under `context/`.

## License

[MIT](LICENSE)
