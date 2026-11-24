# Plan: projects-of-several-forge-owners-watched

## Approach
1. `src/forge/token-router.ts` (new): `createTokenRouter(clients)` returns a `ForgeClient`. For a repository
   (`owner, name`, or a path `/repos/{owner}/{name}…`) it picks the first client whose `getRepository` succeeds and
   remembers the pick for its lifetime; when none does, it answers the first client's failure. `createIssue` tries
   the picked client, then the others when the answer is `refused`, `not_found` or `unauthorized`. Other paths go to
   the first client. `getBudget` returns the lowest remaining budget any client reported. One client: no router.
2. `src/projects/forge-access.ts`: `readForgeTokens(env)` reads `FORGE_TOKEN` and `FORGE_EXTRA_TOKENS` (split at
   commas and whitespace, empty and repeated tokens dropped); `getForgeClient` builds the router; `getForgeClients`
   returns the plain clients for the repository list. Tokens are never logged.
3. `src/forge/repositories.ts`: `listReadableRepositoriesOfAll(clients)`: the union of every token's list (deduped
   case-insensitively, sorted); fails only when every list fails. `load-repository-suggestions.ts` uses it.
4. Settings: a repository no token finds answers `projects.no_token_for_owner` naming the owner ("add a token whose
   resource owner is {owner} to FORGE_EXTRA_TOKENS"); `addRepository` returns the owner with the failure.
5. Deploy: `FORGE_EXTRA_TOKENS: ${FORGE_EXTRA_TOKENS:-}` in the app and the worker of
   `docker/prod/docker-compose.yml`; the deploy workflow's `env:` and `secret-names`; the production-stack test pins it
   as optional. README forge-token section and the variables table; CHANGELOG.
6. e2e: the fake forge accepts a second token that alone reads a second owner's repository (`example-team/rho-app`);
   Playwright passes it as `FORGE_EXTRA_TOKENS`; a spec adds the repository on Settings and sees it scanned.

## Key decisions
- Pick by metadata read, not by the tokens' lists (research, option 1); the pick lives as long as the client.
- Separator: commas (the deploy renders them bare) and whitespace both accepted; README documents commas.

## Phase 1: Several tokens

- Files: `src/forge/token-router.ts`, `src/projects/forge-access.ts`, `src/forge/repositories.ts`,
  `src/projects/load-repository-suggestions.ts`, `src/projects/add-repository.ts`, `app/(app)/settings/actions.ts`,
  `src/projects/repository-copy.ts`, `messages/en.ts`, `messages/pl.ts`, `docker/prod/docker-compose.yml`,
  `.github/workflows/deploy.yml`, `README.md`, `CHANGELOG.md`, tests under `tests/forge`, `tests/projects`,
  `tests/deploy`, `e2e/fake-forge.ts`, `e2e/fixtures.ts`, `playwright.config.ts`, a new e2e spec.
- Mode: TDD for the router, the token reading and the union.
- Done when: unit tests (two tokens each reading one owner: reads, issue creation with its own token, the fallback
  write on a public repository, budget, a repository no token reads) pass; production-stack test pins the optional
  secret; gates green; e2e adds and scans the second owner's repository; the pull request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Several tokens

#### Automated
- [x] 1.1 New unit tests red before the change (10 failed on master's source: list union, owner naming, token reading; router module absent) — e85b40f
- [x] 1.2 Unit tests green after the change (router 11, union 3, tokens 4, add-repository, production-stack 18) — e85b40f
- [x] 1.3 Gates green: typecheck, lint (language scan), test 544/544 — e85b40f
- [x] 1.4 Full e2e green locally: 65/65 (`npm run build && npm run e2e`); the pull request's CI is the merge gate — e85b40f
