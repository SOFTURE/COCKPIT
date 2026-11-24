# Research: projects-of-several-forge-owners-watched

## How it works today
- `src/projects/forge-access.ts` `getForgeClient(env)` builds one `ForgeClient` from `FORGE_TOKEN` (null when unset).
  It is called per use: the scan job factory (`src/jobs/handlers.ts`), Settings (`app/(app)/settings/actions.ts`),
  answers (`app/(app)/inbox/answer/actions.ts`), broadcasts (`app/(app)/broadcast/actions.ts`), MCP
  (`src/mcp/create-server.ts`), the roadmap view (`src/roadmap/load-roadmap-view.ts`), the project history
  (`src/project-page/history/load-history.ts`) and the repository list (`src/projects/load-repository-suggestions.ts`).
- Every repository read and the one write go through the `ForgeClient` interface (`src/forge/client.ts`). The
  repository-scoped methods take `owner, name`; `probe(path)` and `getJson(path)` take a path, and every caller builds
  it as `/repos/{owner}/{name}/…` (`repositoryPath`, `src/forge/permissions.ts`, `src/forge/runs.ts`, adapters).
  The only path that is not repository-scoped is `/user/repos` (`src/forge/repositories.ts`).
- `getBudget()` is read by the scan (`src/scan/scan-projects.ts`) to pause before the forge's limit.
- A fine-grained token has one resource owner; a repository outside it answers 404, so
  `checkRepositoryAccess` returns `not_found` and Settings says "Grant the access token: Metadata: read".
- `hasLabel` turns a 404 into `false`, so a token that cannot see the repository answers "no label" rather than a
  failure: a router must pick the token before such a call, not by its answer.
- Deploy: `.github/workflows/deploy.yml` lists every name it renders (`env:` and `secret-names`); the renderer
  (`@softure-ai/deploy` `env-file.ts`) writes commas bare, quotes spaces and refuses newlines.
  `tests/deploy/production-stack.test.ts` pins the secret names and the compose lines.

## Options
1. A routing client: `getForgeClient` returns one `ForgeClient` that holds a client per token and, per repository,
   uses the first token that reads the repository's metadata (`GET /repos/{owner}/{name}`), remembered for the
   client's lifetime (one scan run, one request); `/user/repos` is the union of the tokens' lists. No caller changes.
   Chosen.
2. The first token whose `/user/repos` list holds the repository (the roadmap's recommendation): needs every token's
   full list before the first read (up to five pages each) and a cache with its own staleness; a token's public
   repositories of another owner are not in its list either. Rejected: option 1 answers the same question with one
   GET per repository and token, and never caches across runs.
3. A GitHub App installed on both owners: COCKPIT has no App authentication; out of scope for an M item.

## Risks
- A public repository of another owner is readable by the first token but its issue creation is refused: the write
  tries the next tokens when the chosen one is refused or does not find the repository (nothing was created then).
- Budget: with several tokens the scan should pause on the lowest remaining budget any token reported.

## Answers to the unknowns
- Which token reads a repository: the first that reads its metadata, decided per client (option 1).
- GitHub App: not needed; no SOFTURE/AI gap filed.
