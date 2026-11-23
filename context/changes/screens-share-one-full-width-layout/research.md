# Research: screens-share-one-full-width-layout

## Where the time goes on Settings
- `app/(app)/settings/page.tsx` awaits `loadWatchedRepositories()` and `hasRole()` (database), then
  `loadRepositorySuggestions()`, which calls `listReadableRepositories()` (`src/forge/repositories.ts`): one request to
  `/user/repos?per_page=100&page=N` after another, up to five pages, on every render, with no cache. Nothing on the page
  is sent before the last page answers.
- Measured with a fake forge that answers each page after 150 ms and a token that reads 240 repositories (three pages):
  501 ms on the first call and 457 ms on the second (no cache), so the render cost grows with the number of pages and
  is paid on every visit. Against the real forge a page takes several hundred milliseconds, so a token with a few
  hundred repositories costs seconds per visit. Script: `node <scratch>/measure.ts` (fake `fetch`, no network).
- The shared layout (`app/(app)/layout.tsx`) reads the inbox and the overview from the database only; it is the same on
  every screen and not part of what makes Settings slower than the others.

## Layout today
- `AppShell` already gives the content area the full width (`w-full px-4 py-6 md:px-8 xl:px-12`).
- Settings caps itself with `mx-auto max-w-content-width`; every other screen is full width but each page builds its
  own wrapper: `grid w-full gap-4` (inbox, broadcast, project page, roadmap view), a bare fragment with `py-4`
  sections (overview, scan status, history, team). Settings has its own `SettingsCard` (gap-5), the other screens use
  `src/shell/section-card.tsx` (gap-4).
- `/account/password` and `/account/mcp` are pages of `@softure-ai/auth` and `@softure-ai/mcp-access`, outside the
  app shell; out of scope.

## SOFTURE modules
- `@softure-ai/theme-notion` ships `PageHeader` (title, crumbs, description, actions) and `Card`, but no page layout
  that fixes the page's width and the spacing between the header and the sections. The local `PageLayout` is a thin
  composition of `PageHeader`; a shared page primitive is a gap any app hits and goes to SOFTURE/AI as an issue.

## Risks
- A cached list can be stale (a repository granted to the token a minute ago is missing): the page says when the list
  was read and offers a refresh; typing `owner/name` still works as before.
- The cache lives in the server process; a restart empties it, and the first visit after it reads the forge again
  (streamed, not blocking the page).
