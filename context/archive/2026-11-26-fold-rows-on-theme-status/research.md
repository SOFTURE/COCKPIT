# Research: fold-rows-on-theme-status

## Today
- `src/shell/status-action-fold-row.tsx` (CT-11): wraps `FoldRow` (`size="touch"`) with a summary grid
  (`data-row-bar`, `data-row-side`, `data-row-status`), an inert, invisible copy of the action in the summary
  (`data-action-place`) and the real action laid over it from the `li` (`data-row-action`, `absolute top-8 right-2`).
  The `li` forces the summary to `items-start` (chevron on line 1) and lights the summary on hover.
- Its one caller: `ItemRow` in `src/roadmap/roadmap-view.tsx` (`id=item-<ID>`, `scroll-mt-16`, `data-item`,
  `data-status`; status = `StatusPill` + owner-step `Badge`; action from `ItemsSection.renderAction`, the promote
  control on queued roadmaps; details table + owner-step alert + long fields as children).
- `ItemsSection` renders on the roadmap view page (`/projects/<repo>/roadmaps/<name>`), reached from the project
  page's Roadmaps tab.

## The package (`@softure-ai/theme-notion` 0.35.0, already on master)
- `FoldRow` takes `status` and `actions`. With either, it renders `div[data-slot=fold-row-with-actions]` (grid, one
  column below `md`, `minmax(0,1fr)_auto` from `md`), the `<details>` holding only the summary, a column
  `div[data-slot=fold-row-actions]` with `[data-slot=fold-row-status]` and `[data-slot=fold-row-action-list]`
  (controls get `min-h/min-w-touch-target` below `md`), and the opened content `[data-slot=fold-row-content]` as the
  next grid row (`peer-open`). The details and the column light together on hover and while open.
- Below `md` the column wraps under the summary (`pl-8`, i.e. at the title's x); from `md` it is a flex column,
  right-aligned, vertically centred, as tall as the summary.
- The summary is `items-center`: the chevron is centred on a multi-line summary (the local copy forced it to line 1).
- Without `status` and `actions` (none here: every item has a status pill) it is the plain details row.

## Unknown resolved
- The `li` can keep `id`, `scroll-mt-16`, `data-item`, `data-status` and wrap `FoldRow`: `FoldRow` renders a `div`,
  valid inside an `li`; `#item-…` links scroll to the `li`.

## Tests touching it
- `e2e/promote.spec.ts`: `expectActionUnderStatus` asserts no `fold-row-actions` and uses `data-row-status` /
  `data-row-action`; `[data-row-action]` count 0 on a done item.
- `e2e/project-page.spec.ts`: `expectOneRowInset` measures the summary and the details table against the `li`
  (the summary is now narrower than the `li` from `md`: the column sits beside it).
- No unit test renders the roadmap view yet.

## Reuse
- Package component as is; no local wrapper. `captureEvidence` (`e2e/capture-evidence.ts`) for the screenshots.
