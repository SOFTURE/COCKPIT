# Plan: project-page-sections-as-tabs

## Approach
A pure function `buildProjectTabs` (in `src/project-page/project-tabs.ts`) turns the page data into the tab list
(key, label, count, href) and the shown tab: the `tab` query parameter when it names an available tab, otherwise the
first tab with something in it, otherwise "Waiting". The page reads `searchParams`, draws the theme's `TabBar`
(`size="touch"`, back to the control height from md up) with a lucide icon per tab, and renders only the shown tab's
panel. The panels reuse today's section cards unchanged, so their region names stay.

## Key decisions
- Tabs are links (`?tab=waiting|roadmaps|changes|production`): a tab has its own address, the back button and a
  reload keep it, and the answer form's server action re-renders the same tab.
- Counts: Waiting = entries; Roadmaps = active roadmap (0 or 1) + queued roadmaps; Changes = open changes; no count
  when no state was read (Roadmaps, Changes) and none on Production.
- Production appears only when health or deploy reports (as the card today); an unknown or unavailable `tab` value
  falls back to the default.
- The wake card moves into the Waiting tab below the entries.
- Messages: own keys `tabsLabel` and `tabs.{waiting,roadmaps,changes,production}` in `projectPage`, English and
  Polish.

## Phase 1: Tabs on the project page

- Files: `src/project-page/project-tabs.ts`, `tests/project-page/project-tabs.test.ts`,
  `app/(app)/projects/[owner]/[name]/page.tsx`, `messages/en.ts`, `messages/pl.ts`, `e2e/project-page.spec.ts`,
  `e2e/deploy.spec.ts`, `e2e/health.spec.ts`, `e2e/wake.spec.ts`, `CHANGELOG.md`.
- Mode: TDD for `buildProjectTabs` (five entries, no active roadmap, one queued → "Waiting 5", "Roadmaps 1",
  Waiting shown; empty project; unknown and unavailable `tab`; no state; production only when reported); e2e
  updated to reach each section through its tab.
- Done when: unit tests green; the e2e shows the tabs with counts on omicron-app, switches tabs by link (the address
  carries the tab), answers an entry from the Waiting tab and the reload stays there; deploy, health and wake are
  reached through their tabs; screenshots at 1280 and 390, light and dark, inspected and stored as evidence; gates
  (typecheck, lint, test), build and the full e2e green; the pull request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Tabs on the project page

#### Automated
- [ ] 1.1 `buildProjectTabs` unit tests red, then green
- [ ] 1.2 Page draws `TabBar` with icons and counts and renders the shown tab's panel
- [ ] 1.3 e2e updated and green (project page, deploy, health, wake, polish)
- [ ] 1.4 Screenshots light/dark at 1280 and 390 inspected and stored
- [ ] 1.5 Gates green: typecheck, lint (language scan), test, doctor
