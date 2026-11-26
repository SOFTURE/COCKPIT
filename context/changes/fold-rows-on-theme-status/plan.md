# Plan: fold-rows-on-theme-status

## Approach
`ItemRow` renders `<li id data-item data-status class="scroll-mt-16">` around theme-notion's `FoldRow` with
`size="touch"`, `summary` (ID column + title, status detail, outcome), `status` (the status pill and the owner-step
tag), `actions` (the promote control, omitted when none), `detailsLabel`/`details` and the children. The local
`StatusActionFoldRow` is deleted. The e2e specs assert the package's slots by bounding box at 1280 and 390 px.

## Key decisions
- The package as it is: no class overrides on its slots (the chevron is centred by the package; if that reads
  wrong on screenshots, it becomes a SOFTURE/AI issue, not a local override).
- The status pill and the owner-step tag share `fold-row-status` (one line, `flex items-center`, gap from the
  pill's own wrapper `flex gap-2`).
- No new messages: no user-visible text changes.

## Phase 1: Item rows on FoldRow's column

- Files: `src/roadmap/roadmap-view.tsx`, `src/shell/status-action-fold-row.tsx` (deleted),
  `tests/roadmap/roadmap-view-markup.test.tsx` (new), `e2e/promote.spec.ts`, `e2e/project-page.spec.ts`,
  `CHANGELOG.md`.
- Mode: TDD for the markup test (fails while the local row renders `data-row-bar`), test-after for the e2e layout.
- Done when: the unit test asserts `[data-slot=fold-row-status]` with the pill and owner tag,
  `[data-slot=fold-row-action-list]` with the control, and no `data-row-bar`/`data-action-place`/`data-row-action`;
  no file in `src/` imports `status-action-fold-row`; e2e opens and closes an item, follows an `#item-…` link,
  promotes an item, and at 1280 and 390 px asserts by bounding box that the pill and the control sit in the right
  column (1280: right of the summary, right edges aligned, control under the pill) and under the summary (390:
  below the summary's bottom, control at least 44 px); the opened details start 8 px inside the row; screenshots of
  the roadmap view before and after at 1280 and 390, light and dark, inspected and stored as evidence; gates green;
  every CI job green before the merge, master CI green after it.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Item rows on FoldRow's column

#### Automated
- [ ] 1.1 Markup unit test for an item row with status, owner tag and action (`tests/roadmap/roadmap-view-markup.test.tsx`)
- [ ] 1.2 `ItemRow` on `FoldRow` `status`/`actions`; `StatusActionFoldRow` deleted
- [ ] 1.3 e2e: open/close, `#item-…` link, promote, column by bounding box at 1280 and 390 (`e2e/promote.spec.ts`, `e2e/project-page.spec.ts`)
- [ ] 1.4 Screenshots before and after at 1280 and 390, light and dark, inspected and stored as evidence
- [ ] 1.5 Gates green: typecheck, lint (language scan), test, doctor
