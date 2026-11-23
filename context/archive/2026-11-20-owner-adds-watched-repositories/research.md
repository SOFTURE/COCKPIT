# Research: owner-adds-watched-repositories

Input: change.md, roadmap CMP-2, PRD FR-2, NFR-5, NFR-6, the READMEs of `@softure-ai/core` (requestJson),
`@softure-ai/db`, `@softure-ai/testing` (fakeFetch) and the example module of SOFTURE/AI
(`examples/next-app/modules/guestbook`). Depth: normal.
Snapshot: CMP-1 branch (fca1fe5), 2026-11-23.

## Summary
The app has the shell, the auth guard and PGlite but no table of its own. The watched repositories become COCKPIT's
first own module (`modules/projects`, schema `projects`, one table, one migration), shaped like the example app's
guestbook module, so `npm run migrate` and `createTestDatabase(config.modules)` pick it up with no extra wiring. The
forge is called with `requestJson` of `@softure-ai/core`; there is no SOFTURE forge client to reuse (the connections
README leaves provider clients to the app).

## Current state
- `softure.config.ts`: modules security, auth, ops. No app module, no migration.
- `app/(app)/settings/page.tsx`: the account section only. `app/(app)/layout.tsx` passes `projects={[]}` to the shell;
  `src/shell/app-sidebar.tsx` already renders a Projects group from `SidebarProject[]`.
- `context/workflow.json` → `migrations: null`.

## Findings
- **Module pattern** (example app): `defineModule({ manifest: { id, dbSchema, tables, ... }, migrations: { dir:
  resolveMigrationsDir(import.meta.url, "./migrations/") }, health })`; migrations are plain SQL run inside the
  module's schema, with a `Rollback:` comment; queries return `Result` and log with `errorLogLabel`.
- **Forge reads** (`requestJson`): 401 and 403 map to `core.http_refused`, 404 to `core.http_unexpected_answer`; the
  status is on the failure. `readHeaders` lets a failure carry named headers.
- **Missing permissions on the forge (the unknown):** for a fine-grained token, a 404 on `GET /repos/{owner}/{name}`
  means the repository is not in the token's selection (or does not exist); a 403 on a resource the repository has
  carries the header `X-Accepted-GitHub-Permissions` (for example `contents=read`), which names the permission the
  call needed. COCKPIT reads that header and maps it to the permission names of NFR-5 (Metadata, Contents, Issues,
  Pull requests, Actions); without the header the probe's own permission is named.
- **Probes per repository** (all reads, NFR-5): metadata (`GET /repos/{o}/{r}`, also gives the default branch),
  contents (`GET /repos/{o}/{r}/contents/context/state.json?ref=<default>`; 404 = no state yet), pull requests
  (`GET .../pulls?per_page=1`), issues (`GET .../issues?per_page=1`), actions (`GET .../actions/runs?per_page=1`).
  Issues *write* cannot be probed without a write; it is checked when the first answer is sent (CMP-5).
- **Fake forge:** unit tests use `fakeFetch`; the e2e runs a real server, so it needs a small HTTP fake on its own
  port, started by Playwright next to the app, with `FORGE_API_URL` pointing at it.
- **Token:** `FORGE_TOKEN` from the environment (NFR-6: never logged; `requestJson` keeps headers out of failures).

## Unknowns answered
- *How does the forge report missing fine-grained permissions?* 404 for a repository outside the token's selection,
  403 with `X-Accepted-GitHub-Permissions` for a missing permission on a selected repository.

## Modules (SOFTURE first)
Adopted: core (`requestJson`, `defineModule`, `Result`), db (migrations, drizzle), testing (`fakeFetch`),
theme-notion (`Status`, `Field`/`Input`, `Button`). Built here: the forge probes and the projects module, both
COCKPIT-specific. No gap.

## Risks
- The fake forge drifts from the real API → the probes depend only on statuses and one header, both documented.
