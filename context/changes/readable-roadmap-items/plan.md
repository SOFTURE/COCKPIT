# Plan: readable-roadmap-items

## Approach
1. `parse-roadmap.ts`: `stripComments(text)` removes `<!-- … -->` and collapses the spaces left; applied to titles,
   row cells, field text and list entries, orders and checks.
2. `build-roadmap-view.ts`: `splitLabelledParts(text)` cuts a text at inline `**Label:**` markers into a lead and
   labelled parts. The outcome's lead stays the outcome; its parts become fields. A field's own parts become fields
   after it. `Owner step` (field or part) becomes `item.ownerStep`. `Change` joins `Change ID`, `Depends on` joins
   the prerequisites; both leave the field list. Remaining fields are split into `facts` (no list, text of at most
   40 characters: `Priority: P1`) and `fields` (the long ones).
3. `roadmap-view.tsx`: the closed row shows ID, title, status, stage, an "Owner step" badge and the outcome clamped
   to two lines (unclamped while open). The opened row shows the owner step in a highlighted block, then one details
   table (prerequisites, size, facts, change, mode), then the long fields as labelled paragraphs.
4. `RoadmapOverview`: progress and counts move to the card's `action` slot, right of the title, wrapping on a phone.
5. Messages `en.ts`/`pl.ts` (`ownerStepLabel`, item hint), fixture item in `e2e/fake-forge.ts` with the messy shapes,
   unit and e2e assertions, CHANGELOG.

## Key decisions
- The 40-character threshold keeps one-word facts in the table and sends sentences to paragraphs; no list of known
  labels, so new fields a roadmap invents still land somewhere sensible.

## Phase 1: Clean items and overview header

- Files: `src/roadmap/parse-roadmap.ts`, `src/roadmap/build-roadmap-view.ts`, `src/roadmap/roadmap-view.tsx`,
  `messages/en.ts`, `messages/pl.ts`, `tests/roadmap/*.test.ts`, `e2e/fake-forge.ts`, `e2e/project-page.spec.ts`,
  `CHANGELOG.md`.
- Mode: TDD for the parser and the view model.
- Done when: unit tests for comment stripping, labelled parts, owner step, folded duplicates and facts pass; e2e
  asserts the owner step, the single change and no comment text; gates green; full e2e green; screenshots at 1280
  and 390 in both themes look right; the pull request's CI green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Clean items and overview header

#### Automated
- [ ] 1.1 New unit tests red before the change
- [ ] 1.2 Unit tests green after the change
- [ ] 1.3 Gates green: typecheck, lint, test
- [ ] 1.4 Full e2e green locally; the pull request's CI is the merge gate

#### Manual
- [ ] 1.5 Screenshots before/after at 1280 and 390, light and dark, inspected and stored as evidence
