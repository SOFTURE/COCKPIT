---
change_id: routine-row-tidy
title: "A routine row says each fact once and keeps its controls in one row menu"
status: new
roadmap_item: CT-22
branch: null
created: 2026-11-25
updated: 2026-11-25
---

## Intent
A routine row on a project's Routines tab shows, in its right column, one last-call badge on top (result and time, for example "HTTP 200 · 21:04", red on an error) and under it the on/off switch with its label and one "More actions" button that opens a menu with Test, Replace token and Delete (Delete last, in the danger tone, still asking in the shared confirmation dialog); the separate state icon and the duplicate "last call" detail line are gone. The menu is the shared `RowActionsMenu`, and `ListRow`'s doc comment states the two rules: at most one inline control, the rest in the menu; each fact said once.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-22: A tidy routine row and the shared row menu
- **Change ID:** `routine-row-tidy`
- **Status:** ready
- **Outcome:** a routine row on a project's Routines tab shows, in its right column, one last-call badge on top (result
  and time, for example "HTTP 200 · 21:04", red on an error) and under it the on/off switch with its label and one
  "More actions" button that opens a menu with Test, Replace token and Delete (Delete last, in the danger tone, still
  asking in the shared confirmation dialog); the separate state icon and the duplicate "last call" detail line are
  gone. The menu is the shared `RowActionsMenu`, and `ListRow`'s doc comment states the two rules: at most one inline
  control, the rest in the menu; each fact said once.
- **Prerequisites:** —
- **Touches (estimate):** `src/shell/row-actions-menu.tsx` (new, on theme-notion's `DropdownMenu`),
  `src/shell/list-row.tsx` (doc comment), `src/shell/confirm-delete-button.tsx` (opened from a menu item),
  `src/routines/routines-section.tsx`, `src/routines/routine-forms.tsx` (Test and Replace token started from a menu
  item), `messages/en.ts` and `messages/pl.ts` (own keys), `tests/shell/**`, the Routines e2e spec.
- **Size:** M
- **Unknowns:**
  - How Test reports its result once it runs from a menu item: the last-call badge refreshes and the result is
    announced (today's `Result` is hidden and announced); recommended: keep that, no toast. (owner: research; blocks: no)
  - Whether a dialog opened from a `DropdownMenu` item keeps focus right (Radix needs the menu closed first or a
    controlled dialog). (owner: research; blocks: no)
- **Risk:** the Routines e2e specs click Test, Replace token and Delete directly; they must open the menu first, and
  their `data-*` selectors stay.
- **Baseline:** today the row shows the enabled state three times and four loose controls on a wrapped line (F-1
  screenshot); after: a unit test pins `RowActionsMenu` (items, keyboard, destructive last) and the e2e at 1280 and
  390 px finds one badge, the switch and the menu button on one line in the right column, and the three actions in
  the menu.
- **PRD refs:** F-1, F-2
- **Input:** context/changes/routine-row-tidy/change.md

Findings gathered while recording it:
- Owner, 2026-11-25 21:09Z (translated), with a screenshot of a routine row: "lay it out sensibly, because it is a
  terrible mess". The screenshot (dark theme): right-aligned, a lone green check icon, then a green "HTTP 200" badge
  with its own check icon; on a second line the switch "Włączona", "Test", "Podmień token" and a trash icon; a large
  empty area on the left.
- Code survey (master 064a5ee), `src/routines/routines-section.tsx` `RoutineRow`:
  - `status` = a `Status` icon (green `CircleCheck` when enabled, orange `CirclePause` when disabled, text only for
    screen readers) **and** `LastCallBadge` (`ResultBadge`, success or danger, "HTTP <status>"); the switch's label
    says the same on/off state again, so the enabled state shows three times;
  - `details` also carries `describeLastCall` ("last call at <time>"), the badge's fact split over two places;
  - `actions` = `RoutineEnabledSwitch`, `TestRoutineForm`, `ReplaceTokenDialog`, `ConfirmDeleteButton`: four loose
    controls that wrap.
- `TestRoutineForm` (`src/routines/routine-forms.tsx:259`) already hides its result and lets the last-call badge show it.
- `@softure-ai/theme-notion` 0.31.0 exports `DropdownMenu` (radix); it has no row overflow menu, filed as
  SOFTURE/AI#1486 in this run. Theme 0.34.0 adds `ListEntry`/`ResultBadge` (SOFTURE/AI#1481), still without a menu.
- Owner's standing rule (2026-11-25 12:26Z): every UI fix is a shared component applied app-wide; the rollout is
  CT-23 (controls) and CT-24 (facts).

## Constraints
- Owns exclusively: `src/shell/row-actions-menu.tsx` (new), `src/shell/list-row.tsx`, `src/shell/confirm-delete-button.tsx`, `src/routines/**` except `wake-chip.tsx`.
- Notion design primitives (`DropdownMenu`, `Button`, `Badge`, `Status`); design tokens only, no raw colours.
- User-visible text, `aria-label` included, through `messages/en.ts` and `messages/pl.ts`.
- On a phone the right column wraps under the identity; controls at least 44 px.
- Existing `data-*` selectors stay, so the e2e specs keep reading the rows.
- No migration. No release, tag, publish or deploy.
- Every CI job green before the merge; master CI checked green after it.

## Notes
- Frame skipped: the owner's standing rule; the outcome is not in doubt.
