---
change_id: app-shell-and-owner-sign-in
title: "(foundation) the owner signs in to an empty Notion-style shell; stack, gates and CI set"
status: new
roadmap_item: CMP-1
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
(foundation) the owner signs in with the account the operator created and sees the Notion-style shell (sidebar with Inbox, Projects, Settings; an empty inbox); nobody can sign up; the stack, the gates in `context/workflow.json` and CI on GitHub-hosted runners (gates, English-only check, and `softure-skills doctor` in a job named `context-doctor`) are in place.

## Context
Roadmap item CMP-1 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-1: App shell and owner sign-in
> - **Change ID:** `app-shell-and-owner-sign-in`
> - **Status:** ready
> - **Outcome:** (foundation) the owner signs in with the account the operator created and sees the Notion-style shell (sidebar with Inbox, Projects, Settings; an empty inbox); nobody can sign up; the stack, the gates in `context/workflow.json` and CI on GitHub-hosted runners (gates, English-only check, and `softure-skills doctor` in a job named `context-doctor`) are in place.
> - **Unlocks:** CMP-2 to CMP-8 (every screen lives in this shell; every later item runs the gates this item sets).
> - **Prerequisites:** —
> - **Touches (estimate):** `package.json`, `package-lock.json`, `next.config.*`, `tsconfig.json`, `eslint.config.*`, `lefthook.yml`, `softure.config.ts`, `app/layout.tsx`, `app/(auth)/**`, `app/(app)/layout.tsx`, `src/shell/**`, `messages/en.ts`, `app/globals.css`, `.github/workflows/ci.yml`, `context/workflow.json`, `db/` (module migrations of auth and security), `README.md`.
> - **Size:** L
> - **Unknowns:**
>   - Which Postgres setup for local runs and tests (PGlite through `@softure-ai/db` or a container)? (owner: research; blocks: no)
>   - Does `@softure-ai/theme-notion` with the `sft-bridge` render the auth package pages in the shell without local CSS? (owner: research; blocks: no)
> - **Risk:** first because every other item builds in this shell and runs its gates; a wrong stack choice here costs every later item.
> - **Baseline:** no application code, gates null in `workflow.json`; after: CI green on a pull request, a test signs the seeded owner in and finds the empty inbox, sign-up refused, the health endpoint answers ok.
> - **PRD refs:** FR-1, NFR-3, NFR-4, NFR-6, NFR-8
> - **Input:** context/changes/app-shell-and-owner-sign-in/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Modules checked on 2026-11-20 (npm): `@softure-ai/auth` 0.2.19 offers `registrationClosed`, a `create-account` script for the first account of an app with registration closed, roles and a route guard for `proxy.ts`; `@softure-ai/theme-notion` 0.29.0 ships the `Sidebar`, `PageHeader`, `Status`, `List`/`ListGroup`, `FilterChip`, `Table` components and light/dark; its visual baseline `themes/theme-notion/visual/baselines/desktop-light/Sidebar-collapsible-offcanvas-.png` (SOFTURE/AI) shows the target shell: Search, Workspace, an "Inbox 12" row, Projects, Settings. `@softure-ai/config` 0.1.7 gives the ESLint preset, tsconfig base, lefthook hooks and `softure-check-language`; `@softure-ai/testing` 0.5.2 the Vitest preset and Playwright helpers; `@softure-ai/ops` 0.2.6 the health endpoint; `@softure-ai/observability` 0.8.8 logs and OTLP; `@softure-ai/core` 0.2.11 the app config and messages.
- Baseline probe (2026-11-20): UI, server, data, auth, mail, deploy, tests and observability are absent; the repository holds only `context/`, `AGENTS.md`, `README.md`, `LICENSE` and `@softure-ai/skills` 0.21.0. CI: absent (AGENTS.md: "introduced together with the stack, not before").
- Owner's brief: "The roadmap's first item sets the stack and the gates in context/workflow.json." "CI on GitHub-hosted runners (public repository)."

## Constraints
- Owns (estimate, from the roadmap's lanes): `package.json`, `package-lock.json`, `next.config.*`, `tsconfig.json`, `eslint.config.*`, `lefthook.yml`, `softure.config.ts`, `app/layout.tsx`, `app/(auth)/**`, `app/(app)/layout.tsx`, `src/shell/**`, `messages/en.ts`, `app/globals.css`, `.github/workflows/ci.yml`, `context/workflow.json`, `db/` (module migrations of auth and security), `README.md`.
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20).

## Notes
