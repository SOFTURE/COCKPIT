---
change_id: package-updates-in-one-view
title: "Nightly package updates in one view"
status: plan_reviewed
roadmap_item: CT-1
created: 2026-11-24
branch: claude/project-thread-uo1rls
updated: 2026-11-24
---

## Intent
a Packages page lists every watched project with its last package-update pull request (date, and merged, open, or red with its failing check), its held packages with their issue links, and the version of each key `@softure-ai` package in its lockfile against the newest published on npm, behind ones marked; a project with no package-update pull request yet says so.

## Context
Roadmap item (cockpit-v3), quoted:

> ### CT-1: Nightly package updates in one view
> - **Change ID:** `package-updates-in-one-view`
> - **Status:** ready
> - **Outcome:** a Packages page lists every watched project with its last package-update pull request (date, and
>   merged, open, or red with its failing check), its held packages with their issue links, and the version of each
>   key `@softure-ai` package in its lockfile against the newest published on npm, behind ones marked; a project with no
>   package-update pull request yet says so.
> - **Prerequisites:** —
> - **Touches (estimate):** `src/adapters/packages/**` (new adapter: pull requests by the routine's title or branch,
>   `package.json` and `package-lock.json`, `context/workflow.json` → `routines.packageUpdates.hold`, npm registry
>   versions), `app/(app)/packages/**` (new page), `src/shell/navigation.ts` (one entry), `messages/en.ts` and
>   `messages/pl.ts` (own keys).
> - **Size:** M
> - **Unknowns:**
>   - Which packages are "key": every `@softure-ai/*` dependency, or a short list (skills, auth, deploy, mailing,
>     mcp-access)? Recommended: every `@softure-ai/*` entry, key ones first. (owner: research; blocks: no)
>   - The npm registry is a new outside read: one request per package per scan, cached for the scan, and a failure
>     shows "unknown", never a stale version. (owner: research; blocks: no)
>   - How a red pull request is recognised with a fine-grained token that cannot read check runs (SOFTURE/SKILLS#68):
>     the Actions runs of its head, as CMP-7 does. (owner: research; blocks: no)
> - **Risk:** a project that renamed the routine's pull request title shows "no update yet"; the branch prefix is the
>   fallback.
> - **Baseline:** today the owner opens each repository's pull requests and `package.json`; after: a test with three
>   fictional projects on the fake forge (one merged update, one red, one with a held package) and a fake registry
>   shows the three states, the issue link and a behind version; the page passes the phone check at 390 px.
> - **PRD refs:** F-1, FR-17, NFR-7
> - **Input:** context/changes/package-updates-in-one-view/change.md

Findings gathered while recording it (2026-11-24):
- The routine's contract (`@softure-ai/skills` 0.35.0, `routines/package-updates.md`): one pull request titled
  `chore(deps): bump SOFTURE packages (<YYYY-MM-DD>)`, branch `claude/bump-softure-<YYYY-MM-DD>`; held packages in
  `context/workflow.json` → `routines.packageUpdates.hold` as `{ "package", "issue", "since" }`; the report table
  `| Package | Was | Is | Note |` is what the page mirrors per project.
- COCKPIT's own last run: PR #50 (merge 2ee99a5), archived as `context/archive/2026-11-24-bump-softure-packages-2026-11-24/`.
- Adapter contract: `src/adapters/contract.ts`; reads stored in `adapters.reads` (`modules/adapters/migrations/0001_create_reads.sql`), so no migration.
- Red checks with a fine-grained token: Actions runs of the head commit, as CMP-7 does (SOFTURE/SKILLS#68).

## Constraints
- Owns exclusively (estimate): `src/adapters/packages/**` (new adapter: pull requests by the routine's title or branch, `package.json` and `package-lock.json`, `context/workflow.json` → `routines.packageUpdates.hold`, npm registry versions), `app/(app)/packages/**` (new page).
- Shared, append only: `messages/en.ts` and `messages/pl.ts` (own keys in both), `src/shell/navigation.ts` (one entry).
- Read-only toward watched repositories (NFR-7); no release or deploy.

## Notes
- Frame skipped: the outcome is the owner's feedback point F-1, quoted in the roadmap; research found no cheaper path.
