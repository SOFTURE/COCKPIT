# Plan: consistent-row-margins

## Approach
One shared class string in `src/shell/row-inset.ts`: `ROW_SURFACE_CLASS` (rounded, `px-2`, hover background, focus
ring, no negative margin) for clickable rows, and `FOLD_ROW_INSET_CLASS` that sets a `FoldRow`'s summary and opened
content to the same `px-2`. Broadcast history and queued roadmaps drop `-mx-2` and use the shared class; roadmap
items add the fold-row inset. The mode note: `describeOrder` drops a `Mode: owner` note on "Owner at the keyboard"
(it repeats the label) and words any other `Mode: <x>` note as plain "Tryb: <x>" text; item modes are translated.

## Key decisions
- Backgrounds never leave the content box (the owner flagged the bleed); row content is inset 8 px inside it.
- Details of an opened roadmap item align with its chevron, the same inset as the summary.
- Static lists stay as they are: no background, text on the content edge.

## Phase 1: One row inset and the mode note

- Files: `src/shell/row-inset.ts`, `src/roadmap/roadmap-view.tsx`, `src/roadmap/describe-order.ts`,
  `src/project-page/project-page-sections.tsx`, `app/(app)/broadcast/page.tsx`, `messages/en.ts`, `messages/pl.ts`,
  `tests/roadmap/describe-order.test.ts`, `e2e/project-page.spec.ts`, `CHANGELOG.md`.
- Mode: test-after for the layout (e2e measures the insets on a production build), TDD for `describeOrder`.
- Done when: unit tests cover the dropped and translated notes and modes; the e2e checks that an opened roadmap
  item's summary and details start at the same x and its background stays inside the card content box, and that the
  owner note is gone; screenshots before and after at 1280 and 390, light and dark, inspected and stored as
  evidence; gates green; every CI job on the pull request green before the merge, and master CI green after it.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: One row inset and the mode note

#### Automated
- [x] 1.1 Shared row inset applied to roadmap items, queued roadmaps and sent broadcasts — 659d86a
- [x] 1.2 Mode note dropped or worded in the panel's language; item modes translated; unit tests (`tests/roadmap/describe-order.test.ts`) — 659d86a
- [x] 1.3 e2e measures the insets and the missing note (production build; `e2e/project-page.spec.ts` and `e2e/broadcast.spec.ts` 11/11) — 659d86a
- [x] 1.4 Screenshots before and after at 1280 and 390, light and dark, inspected and stored as evidence (`cockpit/evidence/consistent-row-margins/04-roadmap-{before,after}-{1280,390}-{light,dark}.webp`, `05-broadcast-…`, `01-inbox`, `02-projects`, `03-project`, `06-settings`, `07-history`) — 659d86a
- [x] 1.5 Gates green: typecheck, lint (language scan), test (633/633), doctor — 659d86a
