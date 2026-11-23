# Research: app-shell-and-owner-sign-in

Input: change.md, roadmap CMP-1, the READMEs of the `@softure-ai/*` packages (npm, 2026-11-23) and the
example app of SOFTURE/AI (`examples/next-app`, read-only clone). Depth: normal.
Snapshot: 963c792 on master, 2026-11-23 08:20 Europe/Warsaw.

## Summary
The repository has no application code. Every layer CMP-1 needs ships in a SOFTURE package: accounts, sessions,
closed registration, the route guard and the sign-in pages (`@softure-ai/auth` 0.2.21), rate limits
(`@softure-ai/security` 0.2.12), the health route (`@softure-ai/ops` 0.2.6), the database layer and the migrator
(`@softure-ai/db` 0.1.17), the shell components (`@softure-ai/theme-notion` 0.30.0 with `sft-bridge.css` for the auth
pages), the tooling (`@softure-ai/config` 0.1.7) and the test helpers (`@softure-ai/testing` 0.5.2). The example app
of SOFTURE/AI wires them exactly the way this change needs (`softure.config.ts`, `proxy.ts`, `instrumentation.ts`,
`app/api/health/route.ts`, `next.config.ts`). Nothing has to be built locally beyond the shell layout and the copy.

## Current state
- `package.json`: only `@softure-ai/skills` as a devDependency; `type: module`, Node >= 22.
- `context/workflow.json`: gates, integration and migrations are `null`.
- No CI (`.github/` absent), no hooks.

## Findings
- **Auth** (`@softure-ai/auth` README §3, §4): `registrationClosed: true` closes the register form (the page shows a
  notice, the action refuses with `auth.registration_closed`); `createCreateAccountScript(config, { maxAccounts })`
  creates the owner's account (the operator's step); `createTestAccount` writes an account for tests; `LoginPage`,
  `RegisterPage`, `ChangePasswordPage` mount with one line; `requireUser()` is the real access check and
  `createAuthGuard(config, { protect: ["/"], exclude: [...] })` the proxy convenience; `routes.afterLogin` sets the
  landing page. It needs the `AUTH_RATE_LIMIT_BUCKETS` in `security`.
- **Security** (README §3): a client address resolver is required; `clientIpFromEnv(process.env)` picks the edge
  by `CLIENT_IP_SOURCE`; a stack without an edge (dev, the e2e) needs `unidentified: { key: "local" }`, which must stay
  out of production, so it is switched by an environment variable set on those stacks only.
- **Ops**: `export { GET } from "@softure-ai/ops/next"` is `/api/health`; it runs every module's health check (auth
  checks its tables).
- **Database** (`@softure-ai/db` README §3-§5): `pglite://<dir>` runs a real Postgres in-process for development and
  the e2e, `postgres://` with `pg` in production; `createTestDatabase(modules)` gives a migrated in-memory PGlite per
  test (global setup caches the template); `softure migrate` applies module migrations in order; `next.config.ts`
  wraps the config in `withDatabaseBuild` so the drivers stay external.
- **Theme** (`@softure-ai/theme-notion` README "Install and wire up"): the app that also renders package pages takes
  ui's `styles.css` first, the scoped preflight, then `theme.css`, `sft-bridge.css`, `base.css`, `page.css`.
  `Sidebar`, `SidebarProvider`, `SidebarInset`, `SidebarMenuButton`, `SidebarMenuBadge` and `PageHeader` are the shell;
  `Empty` the empty inbox. Statuses always carry a word and an icon.
- **Config** (`@softure-ai/config` README): `createSoftureEslintConfig` with `eslint-config-next`, the tsconfig base,
  the lefthook preset (with `next typegen` before `tsc` in the app's own lefthook file), and `softure-check-language`
  for the English-only gate.
- **Testing** (`@softure-ai/testing` README): `softureVitestConfig()` (inline `@softure-ai/*`, `server-only` stub,
  pinned zone); `@softure-ai/testing/playwright` (`test` with a client address per test, `submitLogin`,
  `softurePlaywrightUse` for the preinstalled Chromium).
- **CI**: `@softure-ai/skills` 0.24.0 asks for a job named `context-doctor` running `npx softure-skills doctor`
  (AGENTS.md, managed block).

## Unknowns answered
- *Which Postgres for local runs and tests?* PGlite: `createTestDatabase` for unit and component tests, a
  `pglite://` directory for `next dev` and the e2e; CI's e2e uses the same PGlite directory, so no service container
  is needed. Production uses `postgres://` (CMP-8).
- *Does theme-notion with `sft-bridge` render the auth pages without local CSS?* Yes by the README: the bridge points
  ui's `--sft-*` tokens at the Notion tokens on every scheme scope and in every `PageFrame`; the e2e screenshot of the
  login page checks it.

## Modules (SOFTURE first)
Adopted: core, db, auth, security, ops, ui, theme-notion, config, testing, observability. Nothing generic is built in
this repository. No gap found.

## Risks
- Next 16 with `proxy.ts` and React 19.3 are new; the example app runs the same versions (next 16.4.5).
- The login rate limits count per address; the e2e gives each test its own address (`@softure-ai/testing`).
