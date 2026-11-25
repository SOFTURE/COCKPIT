---
change_id: projects-of-several-forge-owners-watched
title: "Projects of several forge owners are watched"
status: archived
roadmap_item: CT-6
created: 2026-11-24
updated: 2026-11-24
---

## Intent
COCKPIT reads and answers each watched repository with a token that may read it: besides `FORGE_TOKEN` an optional secret `FORGE_EXTRA_TOKENS` carries more fine-grained tokens (one per resource owner, separated by whitespace); each repository uses the first token whose repository list holds it, Settings offers the repositories of every token, and a repository no token can read says which owner needs a token. With the organisation's token set, the organisation's repositories are added on Settings and every project is watched.

## Context
Roadmap item (cockpit-v3), quoted:

> ### CT-6: Projects of several forge owners are watched
> - **Change ID:** `projects-of-several-forge-owners-watched`
> - **Status:** ready
> - **Outcome:** COCKPIT reads and answers each watched repository with a token that may read it: besides
>   `FORGE_TOKEN` an optional secret `FORGE_EXTRA_TOKENS` carries more fine-grained tokens (one per resource owner,
>   separated by whitespace); each repository uses the first token whose repository list holds it, Settings offers the
>   repositories of every token, and a repository no token can read says which owner needs a token. With the
>   organisation's token set, the organisation's repositories are added on Settings and every project is watched.
> - **Prerequisites:** —
> - **Touches (estimate):** `src/projects/forge-access.ts` (a client per repository instead of one), `src/forge/client.ts`,
>   `src/forge/repositories.ts` (the union of the tokens' lists), the callers of `getForgeClient()` (`src/scan/**`,
>   `src/decisions/answer-entry.ts`, `src/project-page/load-project-page.ts`, `src/roadmap/load-roadmap-view.ts`,
>   `src/adapters/**` loaders, `src/projects/**`), `docker/prod/docker-compose.yml` and `.github/workflows/deploy.yml`
>   (the optional secret), `README.md` (the forge token section), `messages/en.ts` and `messages/pl.ts` (own keys).
> - **Size:** M
> - **Unknowns:**
>   - Which token reads a repository: the first whose `/user/repos` list holds it (cached as Settings' list is today),
>     or a token named per owner (`OWNER=token`)? Recommended: the list, so the owner pastes tokens without naming
>     owners. (owner: research; blocks: no)
>   - A GitHub App installed on both owners would need no second token, but needs App authentication COCKPIT does not
>     have; a gap in `@softure-ai/*` goes to SOFTURE/AI. (owner: research; blocks: no)
> - **Risk:** a token whose list changes between scans moves a repository to another token; the scan must pick the
>   client per read, never cache it per repository forever.
> - **Baseline:** today one token with a personal resource owner reads 9 of 12 projects; the organisation's private
>   repositories answer 404 to it. After: a test on the fake forge with two tokens, each listing one owner's repositories,
>   scans both projects and creates a cockpit issue in each with its own token; after the owner step below and the
>   next deploy, the overview over MCP lists every project.
> - **Owner step:** see `## Owner decisions and checks` (CT-6).
> - **PRD refs:** F-6, FR-1, NFR-5, NFR-7
> - **Input:** context/changes/projects-of-several-forge-owners-watched/change.md

Findings gathered while recording it (2026-11-24):
- COCKPIT builds one forge client from `FORGE_TOKEN` (`src/projects/forge-access.ts`, `getForgeClient`) and uses it
  for every repository: the scan, the answers (`src/decisions/answer-entry.ts`), the project page, the roadmap view,
  the adapters and Settings' repository list (`src/projects/load-repository-suggestions.ts`, `/user/repos` through
  `src/forge/repositories.ts`, cached by `src/projects/repository-list-cache.ts`).
- A fine-grained token has exactly one resource owner; the deployed token's owner is a personal account, so an
  organisation's private repositories answer 404 (`checkRepositoryAccess` reports `not_found`) and cannot be added.
  Its public repository is readable, but issue creation there is refused.
- The owner step (store a second token as `FORGE_EXTRA_TOKENS`) is recorded under the roadmap's
  `## Owner decisions and checks`; the secret name is fixed by the roadmap, so the owner can store it before release.
- The secret must be rendered by `.github/workflows/deploy.yml` and passed by `docker/prod/docker-compose.yml` as an
  optional value (`${FORGE_EXTRA_TOKENS:-}`), never `:?`, so a deploy without it still runs.

## Constraints
- Owns exclusively (estimate): `src/projects/forge-access.ts`, `src/forge/client.ts`, `src/forge/repositories.ts`,
  `docker/prod/docker-compose.yml`, `.github/workflows/deploy.yml`; edits the callers of `getForgeClient()` only where
  the client is picked.
- Shared, append only: `messages/en.ts`, `messages/pl.ts`, `README.md` (the forge token section).
- Least privilege (AGENTS.md): no classic token, no wider scope; tokens are never logged.
- No release, tag, publish or deploy without the owner's word.

## Notes
- Research picked "first token that reads the repository's metadata" over the roadmap's recommended "first token whose
  list holds it" (research.md, option 1); recorded under Decisions (auto) in the plan review.

## Done
- Merged on the branch at e85b40f; waiting: release (the coordinator's combined deploy). The owner already stored
  `FORGE_EXTRA_TOKENS` in `production` (2026-11-24); after that deploy the organisation's repositories are added on
  Settings.
