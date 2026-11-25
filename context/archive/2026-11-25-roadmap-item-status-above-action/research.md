# Research: roadmap-item-status-above-action

## Where it lives
- `src/roadmap/roadmap-view.tsx` `ItemRow` draws each roadmap item as a theme `FoldRow` (`size="touch"`) with a custom
  `summary` grid (ID, content, status) and passes the page's control through `FoldRow actions`.
- `app/(app)/projects/[owner]/[name]/roadmaps/[slug]/page.tsx` `renderAction` gives a queued roadmap's open item a
  `PromoteForm` (`src/roadmap/promote-form.tsx`, a client component: an `AlertDialog` button, or the link to the issue
  it became). Active roadmaps and done items get no action.
- `@softure-ai/theme-notion` `FoldRow` with `actions` wraps the `<details>` in `fold-row-with-actions` and draws the
  actions in their own strip beside the summary (`fold-row-actions`, `min-h-touch-target`, centred on the first
  line). That strip is what the owner's screenshot shows: a separate box with its own background under the button.
- `FOLD_ROW_INSET_CLASS` (`src/shell/row-inset.ts`) pads the summary `px-2`; the summary is `py-1`.

## Evidence
- Owner's screenshot `cockpit/evidence/roadmap-item-status-above-action/01-item-row-before-3238-dark.webp`: status
  "Zablokowana" on the title's line, "Promuj do realizacji" in the strip to its right, the strip's background ends
  under the button while the bar's continues below it.
- `e2e/promote.spec.ts` drives the promote flow on `example-org/later-app` through `[data-item="LT-n"]` rows and role
  queries; `e2e/project-page.spec.ts` reads `[data-status-detail]` and `[data-item]` on an active roadmap (no action).

## Options
- Put the action inside the `<summary>`: rejected (a control inside a summary is a nested control, and a click on it
  folds the row in some browsers).
- Lay the action over the summary from the `li` (absolute), and hold its place in the summary's right column with an
  invisible, `inert`, `aria-hidden` copy, so the column is exactly as wide and tall as the control. Hovering the
  action lights the summary through a `li:hover` rule. Chosen (also the draft's approach).
- A theme `FoldRow` variant with actions under a status: a layout only this view needs so far; not a package gap.

## Reuse
- `FoldRow`, `StatusPill`, `Badge`, `PromoteForm` unchanged; no message changes.
