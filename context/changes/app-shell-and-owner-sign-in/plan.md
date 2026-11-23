# Plan: app-shell-and-owner-sign-in

## Goal
The owner signs in with the account the operator created and lands on an empty inbox inside the Notion-style shell
(sidebar with Inbox, Projects, Settings); nobody can sign up; the stack, the gates in `context/workflow.json` and CI
on GitHub-hosted runners (gates, English-only check, `softure-skills doctor` in the job `context-doctor`) are in place.
Out of scope: watched repositories, scans and any project data (CMP-2 onwards), deployment (CMP-8).

## Approach
**Starting point:** no application code; `package.json` holds only `@softure-ai/skills`; gates are `null`
(`context/workflow.json:8`).

**Chosen:** a Next.js 16 App Router app on Node 22 wired like the SOFTURE example app: `softure.config.ts` with
`security`, `auth` (registration closed) and `ops`; the auth pages mounted with one line each; a private-by-default
proxy guard plus `requireUser()` in the app layout; the shell from `@softure-ai/theme-notion`; PGlite for development,
tests and the e2e, Postgres in production.
Rejected: a hand-written session layer (auth ships it); a Postgres service container in CI (PGlite gives the same SQL
without a service and runs identically in the cloud session).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Framework | Next.js 16.4, React 19.3, TypeScript 6.0 | the versions the SOFTURE example app runs and the auth peers ask for | research |
| Database in dev and tests | PGlite (`pglite://.data/dev`, `createTestDatabase`) | no server needed locally or in CI | research |
| Styling | theme-notion + Tailwind 4, scoped preflight, `sft-bridge.css` | the README's recipe for apps that render package pages | research |
| Landing page | `/inbox` (`routes.afterLogin`) | FR-1: "they reach the inbox" | PRD |
| Client address | `clientIpFromEnv(process.env)`; `unidentified: { key: "local" }` only with `ALLOW_UNIDENTIFIED_CLIENTS=true` | production must refuse unidentified clients | research |
| Gates | `npm run typecheck`, `npm run lint` (ESLint + language gate), `npm test` (Vitest); integration `npm run e2e` (Playwright) | one command per gate, the same in hooks and CI | plan |
| Roadmap state | `worktree.cloudState: "branch"` | one thread carries the items serially, assigned by the coordinator; the state rides each pull request | plan |

## Phase 1: Stack, tooling and gates
**Discipline:** test-after. **Files:** `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`,
`lefthook.yml`, `lefthook.app.yml`, `vitest.config.mts`, `next.config.ts`, `postcss.config.mjs`, `softure.config.ts`,
`instrumentation.ts`, `src/database.ts`, `scripts/migrate.ts`, `scripts/create-account.ts`, `app/api/health/route.ts`,
`.env.example`, `context/workflow.json`, `tests/config.test.ts`.

1. `softure.config.ts`: `security` (auth buckets, resolver from the environment), `auth` (`registrationClosed: true`,
   `routes.afterLogin: "/inbox"`), `ops`; database URL from `DATABASE_URL`, `pglite://.data/dev` by default.
2. `scripts/migrate.ts` and `scripts/create-account.ts` (`maxAccounts: 1`): the operator's commands.
3. Gates in `package.json` and `context/workflow.json`.

**Tests:** `tests/config.test.ts`: the config defines auth with registration closed and the landing page `/inbox`;
the migrated test database answers the auth health check.

**Done when:**
- Automated: `npm run build` succeeds; the config test passes; Gates green (typecheck, lint, test).

## Phase 2: Sign-in and the shell
**Discipline:** test-after. **Files:** `proxy.ts`, `app/layout.tsx`, `app/globals.css`, `app/login/page.tsx`,
`app/register/page.tsx`, `app/account/password/page.tsx`, `app/(app)/layout.tsx`, `app/(app)/page.tsx`,
`app/(app)/inbox/page.tsx`, `app/(app)/projects/page.tsx`, `app/(app)/settings/page.tsx`, `src/shell/**`,
`messages/en.ts`, `messages/index.ts`, `playwright.config.ts`, `e2e/**`.

1. `proxy.ts`: protect `/`, exclude `/api/health`.
2. `app/(app)/layout.tsx`: `requireUser()`, then the shell (sidebar: Inbox with its count, Projects, Settings; the
   account's email and sign-out at the foot).
3. `app/(app)/inbox/page.tsx`: the empty state ("Nothing waits for you").
4. `e2e/sign-in.spec.ts`: the seeded owner signs in and sees the empty inbox; a visitor is sent to the login page; the
   register page refuses; `/api/health` answers ok; the inbox has no horizontal scroll at 390 px.

**Tests:** the e2e above; `tests/shell/navigation.test.ts`: the sidebar lists Inbox, Projects and Settings in order.

**Done when:**
- Automated: `npm run e2e` passes; Gates green (typecheck, lint, test).
- Manual: the login page and the empty inbox render on the theme in light and dark without local CSS (evidence:
  Playwright screenshots the run inspects).

## Phase 3: CI and the operator's documentation
**Discipline:** test-after. **Files:** `.github/workflows/ci.yml`, `README.md`.

1. `.github/workflows/ci.yml`: on pull requests and pushes to `master`: `gates` (typecheck, lint, test), `e2e`
   (build, migrate a PGlite directory, Playwright), `context-doctor` (`npx softure-skills doctor`).
2. `README.md`: run it locally, the gates, the operator's first account.

**Done when:**
- Automated: the workflow passes on the pull request; `npx softure-skills doctor` passes; Gates green (typecheck,
  lint, test).

## Risks and rollback
- A package page that does not take the theme → the bridge is the package's contract; a gap is filed in SOFTURE/AI.
- Rollback: revert the merge; no data exists yet.

## Decisions (auto)
- PGlite vs a Postgres container for tests → PGlite (the research unknown; no service needed).
- Settings in this item → a page with the account (password change, sign-out); watched repositories come in CMP-2.
- Projects in the sidebar → a group with an empty hint until CMP-2 lists the projects.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Stack, tooling and gates

#### Automated
- [x] 1.1 `npm run build` succeeds
- [x] 1.2 `tests/config.test.ts` passes: registration closed, landing page `/inbox`, auth health check ok on a migrated test database
- [x] 1.3 Gates green (typecheck, lint, test)

### Phase 2: Sign-in and the shell

#### Automated
- [ ] 2.1 `e2e/sign-in.spec.ts` passes: owner lands on the empty inbox, visitor redirected to login, register refused, health ok, no horizontal scroll at 390 px
- [ ] 2.2 `tests/shell/navigation.test.ts` passes
- [ ] 2.3 Gates green (typecheck, lint, test)

#### Manual
- [ ] 2.4 The login page and the empty inbox render on the theme in light and dark (evidence: Playwright screenshots the run inspects)

### Phase 3: CI and the operator's documentation

#### Automated
- [ ] 3.1 The CI workflow passes on the pull request (gates, e2e, context-doctor)
- [ ] 3.2 `npx softure-skills doctor` exits 0
- [ ] 3.3 Gates green (typecheck, lint, test)
