# Plan: row-state-and-controls-on-one-line

## Approach
1. `app/row-layout.css` (imported by `app/globals.css`, unlayered so it wins over the theme's utilities): the
   `ListEntry` column (`[data-slot=list-entry-column]`) without a `data-row-wide` control, and the `FoldRow` column
   (`[data-slot=fold-row-actions]`) from `md`, lay out as one line: `flex-direction: row; flex-wrap: wrap;
   align-items: center; justify-content: flex-end`, the theme's spacing token for the gap. The state comes first in
   the markup, so it stands left of the controls. The file names SOFTURE/AI#1508 and is dropped when the theme ships it.
2. One shared e2e check, `e2e/expect-state-beside-controls.ts`: in a row with a state and controls, at 1280 and 390 px,
   the state's right edge is left of the controls' left edge and their vertical centres are within 2 px; the controls
   end at the column's right edge. Used by the specs for Settings repositories, routines, Broadcast rows and roadmap
   items; `expect-row-state.ts` and `expect-fold-row-column.ts` drop their "controls under the state" assertions and
   assert the same line instead.
3. Screenshots before/after (1280/390, light/dark) of Settings repositories, routines, fired issues, inbox, Broadcast,
   roadmap items, saved to the project's evidence store.

## Key decisions
- App stylesheet over a per-screen class: one place, every current and future row follows it (owner's standard rule).
- `data-row-wide` rows keep the column, as the theme documents.

## Phase 1: One line for state and controls
- Files: `app/row-layout.css`, `app/globals.css`, `e2e/expect-state-beside-controls.ts`, `e2e/expect-row-state.ts`,
  `e2e/expect-fold-row-column.ts`, the specs that call them, `CHANGELOG.md`.
- Mode: TDD: the new e2e check fails on the current build (state above the trash can), passes after.
- Done when: the check red before, green after; gates green; full e2e green; screenshots looked at, no wrap, overlap
  or sideways scroll. PR CI (all jobs) is the merge gate.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: One line for state and controls

#### Automated
- [ ] 1.1 New e2e check red on the current build, green with the stylesheet
- [ ] 1.2 Gates green: typecheck, lint, test
- [ ] 1.3 Full e2e green
- [ ] 1.4 Screenshots before/after at 1280/390 light/dark checked and stored
