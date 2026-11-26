# Implementation review: list-rows-on-theme-list-entry

Verdict: approve (auto). Every list row of the 14 screens is theme-notion's `ListEntry` inside `ListItem`, every list
is the theme's `List` (roomy), row menus sit in the `menu` slot, and `src/shell/list-row.tsx`, `src/shell/row-inset.ts`
and the local row's unit test are gone (`tests/shell/list-entry-rows.test.tsx` pins it). The plan held; one drift,
recorded: the theme bump to 0.37.0 also carries FoldRow `align="start"` on the roadmap item rows (CT-25's file), on
the coordinator's word, so the roadmap rows keep the status on the title's line too.

- Correctness: each row's own `data-*` stay on the row div; e2e reads that moved with them (broadcast hover,
  routine `data-enabled`) are updated. External rows open in a new tab via `ExternalRowLink`.
- Tests: unit 788/788; e2e 82/82 after the two spec fixes; `expectListEntryRows` on all 14 screens; the layout
  helpers measure on the theme's slots (state on the title's line at 1280, 44 px targets at 390).
- Evidence: 19 lists × 4 before and after, looked at pair by pair; no wrap, overlap or misalignment.
- Package gap filed and closed upstream: SOFTURE/AI#1497 (fixed in theme-notion 0.37.0). No local override.

No findings.
