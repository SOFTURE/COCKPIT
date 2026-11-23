# Plan: screens-share-one-full-width-layout

## Approach
Two parts. The repository list behind the picker is read through a small in-process cache (fresh for five minutes,
then served stale while one background read refreshes it; a failed read keeps the last good list), and Settings renders
the add-repository field inside `Suspense`, so the watched repositories, the team and the account cards are sent at
once and the picker fills in when the list is ready. The page says when the list was read and offers a refresh button
(a server action that rereads the forge). Every screen under `app/(app)/` renders through one `PageLayout`
(`src/shell/page-layout.tsx`): full width, the theme's `PageHeader`, a `gap-4` grid; titled sections use
`SectionCard`. A unit test fails when a page under `app/(app)/` does not render `PageLayout` or caps its width.

## Key decisions
- In-process cache instead of a database table: no migration (constraint), one process serves the app.
- `Suspense` streaming instead of a client fetch: no new route, the form keeps its server action.
- The fallback is the same form with `{ kind: "loading" }`: typing `owner/name` works before the list arrives.
- Settings drops `SettingsCard` for `SectionCard`; scan status and team move their sections into `SectionCard`.
  The overview keeps its status groups and the history page its blocks (lists, not cards) inside `PageLayout`.

## Phase 1: Repository list read once, kept, refreshed
- Files: `src/projects/load-repository-suggestions.ts`, `src/projects/add-repository-form.tsx`,
  `app/(app)/settings/page.tsx`, `app/(app)/settings/actions.ts`, `messages/en.ts`,
  `tests/projects/repository-suggestions-cache.test.ts`.
- Mode: TDD.
- Done when: the cache test (fresh hit without a forge call, stale served at once with one background read, concurrent
  reads deduplicated, a failed read keeps the last list, refresh rereads) passes; Settings streams the field.

## Phase 2: One full-width page layout
- Files: `src/shell/page-layout.tsx`, every `app/(app)/**/page.tsx`, `tests/shell/page-layout.test.ts`, `CHANGELOG.md`.
- Mode: TDD.
- Done when: the layout test is red before the pages move and green after; gates green; e2e green; screenshots of
  Settings at 1280 and 390, light and dark, inspected and stored as evidence.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Repository list read once, kept, refreshed

#### Automated
- [ ] 1.1 Cache test red, then green: fresh hit, stale-while-refresh, dedupe, failure keeps list, refresh
- [ ] 1.2 Settings streams the add-repository field (Suspense) and shows when the list was read, with a refresh

### Phase 2: One full-width page layout

#### Automated
- [ ] 2.1 Layout test red on the current pages, green after every page renders `PageLayout`
- [ ] 2.2 Gates green: typecheck, lint, test, doctor; e2e green
- [ ] 2.3 Screenshots of Settings at 1280 and 390, light and dark, inspected and stored
