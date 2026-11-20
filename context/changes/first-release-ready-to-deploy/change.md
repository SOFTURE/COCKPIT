---
change_id: first-release-ready-to-deploy
title: "(release) the first usable slice is ready to deploy on the owner's server; deploys only on the owner's word"
status: new
roadmap_item: CMP-8
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
The first usable slice is packaged for one server through `@softure-ai/deploy` and `@softure-ai/host` (container, deploy workflow, the secret names, health verification, release notes); a dry run passes; it is deployed and verified only after the owner's word and domain.

## Context
Roadmap item CMP-8 of `context/foundation/roadmap.md` (cockpit-v1, v2), quoted:

> ### CMP-8: First release ready to deploy
> - **Change ID:** `first-release-ready-to-deploy`
> - **Status:** ready
> - **Outcome:** the first usable slice is packaged for one server through `@softure-ai/deploy` and `@softure-ai/host` (container, deploy workflow, the secret names, health verification, release notes); a dry run passes; it is deployed and verified only after the owner's word and domain.
> - **Prerequisites:** CMP-5, CMP-7; the owner's domain and server (OQ-1) and the release word for the deploy step only.
> - **Touches (estimate):** `Dockerfile`, `compose.yaml`, `.github/workflows/deploy.yml`, `deploy/**`, `package.json` (version), `CHANGELOG.md`, `README.md` (operator section: token permissions, secrets, first account).
> - **Size (owner-requested):** M
> - **Slice:** MVP (first usable slice)
> - **Unknowns:**
>   - Which domain and server? (owner: owner, OQ-1; blocks: no for the build, yes for the deploy step)
> - **Risk:** last of the slice: it needs the whole slice; the deploy itself waits for the owner (AGENTS.md: "No release, tag, npm publish or deploy without the owner's word").
> - **Baseline:** nothing deployable; after: the deploy dry run and the container health check pass in CI; after the owner's word: the health endpoint answers ok on the owner's domain and a first scan completes.
> - **PRD refs:** FR-9, NFR-5, NFR-6
> - **Input:** context/changes/first-release-ready-to-deploy/change.md

Findings gathered while recording the roadmap (2026-11-20):
- `@softure-ai/deploy` 0.7.8: "renders .env.prod from CI secrets (names from the compose file), writes the release report between two tags, backs up the database, guards the migration ledger ... verifies production". `@softure-ai/host` 0.1.3: provisions a shared app server (Traefik edge) and "onboards an app with one command".
- AGENTS.md: "The first deployment runs on the owner's server through `@softure-ai/deploy`." `workflow.json` `release.owner: true`: work ends `done_code` with the owner's steps under `## Before the next release`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `Dockerfile`, `compose.yaml`, `.github/workflows/deploy.yml`, `deploy/**`, `package.json` (version), `CHANGELOG.md`, `README.md` (operator section: token permissions, secrets, first account).
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20).

## Notes
