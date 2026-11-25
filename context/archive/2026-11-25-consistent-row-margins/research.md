# Research: consistent-row-margins

## Where the margins come from
- `SectionCard` (`src/shell/section-card.tsx`): content `px-5`; headings and descriptions start on that edge.
- Roadmap items (`src/roadmap/roadmap-view.tsx`, `ItemRow`) use `FoldRow` from `@softure-ai/theme-notion` 0.31: the
  summary is `px-1` with its background on the content edge, the opened content is `p-3`. Chevron and details start
  at different insets (4 px vs 12 px).
- Sent broadcasts (`app/(app)/broadcast/page.tsx`) and queued roadmaps (`src/project-page/project-page-sections.tsx`,
  `QueuedRow`) use `-mx-2 px-2`: the text stays on the content edge and the hover bleeds 8 px past it, past the lines
  between rows.
- Static lists (inbox, history, deploys, packages, watched repositories, members, scan status) have no background;
  their text and lines sit on the content edge. Not affected.
- The sidebar's logout row bleeds over the sidebar footer on purpose; it is not a card list.

## Mode note
- `parse-roadmap.ts` keeps the label's trailing parenthetical as `note` ("`Mode: owner`"); `describeOrder` passes it
  through and `OrdersSection` renders it with `InlineMarkdown`, so it shows as inline code (monospace, padded, which
  makes it look indented) in English.
- Item details show `item.mode` raw ("autonomous").

## Tests touching it
- `tests/roadmap/describe-order.test.ts` (note passed through), `e2e/project-page.spec.ts` (expects the note text
  "Mode: owner").

## Reuse
- The package's `FoldRow` padding is a gap any app would hit (summary and content insets differ). Filed upstream;
  the app sets the inset through the row's `li` selectors as it already does for the chevron.
