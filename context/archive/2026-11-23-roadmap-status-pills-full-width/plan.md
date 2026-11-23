# Plan: roadmap-status-pills-full-width

## Approach
One shared `StatusPill` (theme `Status`: icon plus coloured word, mapped from the status group) replaces the coloured
`Badge` on the roadmap view items, its counts by status and the project page's roadmap items. The waiting condition
or stage moves to its own muted line under the title, prefixed "Waits for" or "Stage" unless it already says so. IDs
become a narrow muted mono column. The shell drops its width cap; the project page, the roadmap view and the inbox
drop their narrow column. `splitRoadmapTitle` turns "Name: long description" into a short title and a subtitle.

## Key decisions
- Status word only in the pill; the detail never goes inside it, so a long condition cannot make a large block.
- `data-stage` stays on the pill (e2e hooks); the detail gets `data-status-detail` (`data-detail` is taken by
  `DetailTable`).

## Phase 1: Status pills, detail line, full width, short title
- `src/project-page/project-page-sections.tsx`: `StatusPill`, icons and colours per group; project page items use it.
- `src/roadmap/roadmap-view.tsx`: items and counts use it; detail line with prefix.
- `src/roadmap/build-roadmap-view.ts`: `splitRoadmapTitle` (TDD).
- `app/(app)/...`: full-width columns; `src/shell/app-shell.tsx` without the cap.
- Done when: unit tests, typecheck, lint, the project-page e2e spec on a production build are green and screenshots
  at 1440/390 light/dark are inspected.

## Progress

### Phase 1: Status pills, detail line, full width, short title
- [x] 1.1 `splitRoadmapTitle` with unit tests (`tests/roadmap/build-roadmap-view.test.ts`, 4 new cases)
- [x] 1.2 Status pills and detail line on the roadmap view and the project page; full-width pages
- [x] 1.3 Gates green: typecheck, lint (language scan), unit tests, `project-page.spec.ts` 8/8 on `next start`
- [x] 1.4 Screenshots 1440/390 light/dark inspected and stored as evidence (`cockpit/evidence/roadmap-status-pills-full-width/`)
