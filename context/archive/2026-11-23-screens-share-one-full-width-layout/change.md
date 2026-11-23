---
change_id: screens-share-one-full-width-layout
title: "Every screen shares one full-width layout"
status: archived
roadmap_item: CV-4
branch: claude/project-thread-uoyx40
created: 2026-11-23
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
Settings opens without waiting for the forge: the list of repositories the token can read is no longer fetched page by page on every render but loaded once, kept for a short time and refreshed in the background or on demand, so the page shows the watched repositories at once; Settings and every other screen (inbox, overview, project pages, history, roadmap view, team, broadcast) use one shared page layout component with the full width of the content area, the same header, spacing and card style; a test fails when a page under `app/(app)/` does not use the shared layout.

## Context
Roadmap item (cockpit-v2), quoted:

> ### CV-4: Every screen shares one full-width layout
> - **Change ID:** `screens-share-one-full-width-layout`
> - **Status:** ready
> - **Outcome:** Settings opens without waiting for the forge: the list of repositories the token can read is no
>   longer fetched page by page on every render but loaded once, kept for a short time and refreshed in the
>   background or on demand, so the page shows the watched repositories at once; Settings and every other screen
>   (inbox, overview, project pages, history, roadmap view, team, broadcast) use one shared page layout component
>   with the full width of the content area, the same header, spacing and card style; a test fails when a page
>   under `app/(app)/` does not use the shared layout.
> - **Prerequisites:** — (runs before or after CV-3, not alongside it)
> - **Touches (estimate):** `app/(app)/settings/page.tsx` and `app/(app)/settings/team/page.tsx` (drop
>   `max-w-content-width`), `src/projects/load-repository-suggestions.ts`, `src/forge/repositories.ts`
>   (`listReadableRepositories` pages through `/user/repos` sequentially), `src/shell/page-layout.tsx` (new), the
>   page wrappers under `app/(app)/**`, `messages/en.ts` (own keys).
> - **Size:** M
> - **Unknowns:**
>   - Where the slowness really is: the forge calls of the repository picker (sequential pages of `/user/repos` on
>     every render, `app/(app)/settings/page.tsx` line 57) or something else; measured first. (owner: research;
>     blocks: no)
>   - Does `@softure-ai/theme-notion` or `@softure-ai/ui` already ship a page layout to adopt instead of a local
>     one? A gap any app would hit goes to SOFTURE/AI. (owner: research; blocks: no)
> - **Risk:** a cached repository list can be stale; the page must say when it was read and offer a refresh.
> - **Baseline:** measure the Settings server render time with a fake forge that answers each page after a set delay
>   (before: grows with the number of pages); after: the page renders without waiting for the forge, and
>   screenshots of every screen at 1280 and 390 px, light and dark, show the same full-width layout.
> - **PRD refs:** F-4, NFR-1, NFR-3, NFR-4
> - **Input:** context/changes/screens-share-one-full-width-layout/change.md

Owner input (2026-11-23, translated): "optimise the Settings tab: first, it is slow; second, it should be 100% wide
like the other screens; do the same for the rest of the screens in the project, everything in one standard".

Findings gathered for this item:
- `app/(app)/settings/page.tsx`: `SettingsPage` awaits `loadWatchedRepositories()` and `hasRole(ADMIN_ROLE)`, then
  `loadRepositorySuggestions(repositories)` before rendering; the page wrapper is
  `mx-auto grid w-full max-w-content-width gap-4`, which caps its width.
- `src/forge/repositories.ts`: `listReadableRepositories` fetches `/user/repos?per_page=…&sort=full_name&page=N`
  one page after another, up to `MAX_PAGES`, on every call.
- The roadmap-view change of 2026-11-23 (PR #43, "full-width pages") made the project pages full width; Settings was
  not part of it.

## Constraints
- Exclusively owned: `src/shell/page-layout.tsx`, `src/projects/load-repository-suggestions.ts`.
- No migration; no new forge scope (NFR-5).
- No release or deploy without the owner's word.

## Notes
- Frame skipped: the owner named both the problem (slow Settings) and the outcome (one full-width standard); research measured the cause.
