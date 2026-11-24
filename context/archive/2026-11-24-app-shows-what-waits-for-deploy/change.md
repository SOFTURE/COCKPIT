---
change_id: app-shows-what-waits-for-deploy
title: "Each app shows what waits for its deploy"
status: archived
roadmap_item: CT-2
branch: claude/project-thread-64pt9j
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
a Deploys page lists every watched app with its last release and its last production deploy, the number of changes merged into the main branch since that release, and the required secrets added since the last deploy (names in `${NAME:?}` lines of its compose file on the main branch that the compose file at the deployed tag did not have); an app with new required secrets is marked "will stop at the secret check" before anyone runs the deploy; a project without a deploy workflow shows nothing.

## Context
Roadmap item (cockpit-v3), quoted:

> ### CT-2: Each app shows what waits for its deploy
> - **Change ID:** `app-shows-what-waits-for-deploy`
> - **Status:** ready
> - **Outcome:** a Deploys page lists every watched app with its last release and its last production deploy, the
>   number of changes merged into the main branch since that release, and the required secrets added since the last
>   deploy (names in `${NAME:?}` lines of its compose file on the main branch that the compose file at the deployed
>   tag did not have); an app with new required secrets is marked "will stop at the secret check" before anyone runs
>   the deploy; a project without a deploy workflow shows nothing.
> - **Prerequisites:** —
> - **Touches (estimate):** `src/adapters/deploy/**` (compare the main branch with the last release, read the compose
>   file at both refs), `app/(app)/deploys/**` (new page), `src/shell/navigation.ts` (one entry), `messages/en.ts` and
>   `messages/pl.ts` (own keys).
> - **Size:** M
> - **Unknowns:**
>   - Where the compose file lives in every app: `docker/prod/docker-compose.yml` as `softure-deploy init` writes it,
>     or a path named in `deploy.json`? (owner: research; blocks: no)
>   - "Merged changes since the release": merge commits on the main branch since the release tag (the compare API) or
>     archived change folders since then? Recommended: merged pull requests, counted with the compare API. (owner:
>     research; blocks: no)
>   - A secret the owner already set before the deploy still counts as "added": COCKPIT cannot read environment
>     secrets with least privilege, so the page says "check it is set", not "missing". (owner: research; blocks: no)
> - **Risk:** the deploy adapter grows from one read to three per project per scan; the forge rate limit must still
>   stop the scan cleanly.
> - **Baseline:** today a missing secret shows only when the deploy fails at the secret check (cockpit-v2 needed
>   `SOFTURE_EMAIL_KEY_SECRET`, found by hand); after: a test with fictional apps on the fake forge (one up to date, one
>   with three merged changes, one whose compose gained a `${NAME:?}` line) shows the count and the new secret's name;
>   the page passes the phone check at 390 px.
> - **PRD refs:** F-2, FR-17, NFR-7
> - **Input:** context/changes/app-shows-what-waits-for-deploy/change.md

Findings gathered while recording it (2026-11-24):
- The deploy adapter already reads deploy runs and the release report (`src/adapters/deploy/read-deploy.ts`,
  `src/adapters/deploy/release-report.ts`) and knows the production version (tag) and the last deploy.
- COCKPIT's own `docker/prod/docker-compose.yml` header: "Every variable below in the required form (a dollar, a
  brace, the name, then :?) is a secret: the deploy workflow renders exactly these names into .env.prod with
  `softure-deploy env render`, so this file stays the one list of what production needs." So "what the last deploy
  rendered" is the `${NAME:?}` set of the compose file at the deployed tag.
- Evidence: the cockpit-v2 release needed `SOFTURE_EMAIL_KEY_SECRET`, added by `@softure-ai/mailing` 0.3.0 in the
  nightly bump (PR #50) and recorded by hand in PR #52 (684dc8b).
- Environment secret names are not readable with the token's least privilege (AGENTS.md: Access to watched
  repositories), so the page names secrets to check, never "missing".

## Constraints
- Owns exclusively (estimate): `src/adapters/deploy/**` (compare the main branch with the last release, read the compose file at both refs), `app/(app)/deploys/**` (new page).
- Shared, append only: `messages/en.ts` and `messages/pl.ts` (own keys in both), `src/shell/navigation.ts` (one entry).
- Read-only toward watched repositories (NFR-7); no release or deploy.

## Notes

Archived 2026-11-24: a Deploys page shows per app the last release, production and last deploy, the pull requests merged since the release, and the required secrets added since production, marking a deploy that will stop at the secret check.
