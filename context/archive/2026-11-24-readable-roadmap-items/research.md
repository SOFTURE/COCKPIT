# Research: readable-roadmap-items

## How it works today
- `src/roadmap/parse-roadmap.ts` reads the at-a-glance rows and the `### ID: title` blocks with `- **Field:** value`
  lines; text is kept verbatim, HTML comments included.
- `src/roadmap/build-roadmap-view.ts` merges row, block and state into `RoadmapViewItem`; it drops the named fields
  `Change ID`, `Status`, `Outcome`, `Prerequisites`, `Size` and keeps every other field. A block written with
  `Change` or `Depends on` (a field name the row's header also uses) therefore repeats the change and the
  prerequisites.
- `src/roadmap/roadmap-view.tsx`: the closed row shows the full outcome; the opened row shows a details table
  (prerequisites, size, change, mode) and then every other field as label + paragraph, in file order.
- The outcome of a row often carries inline labelled parts (`**Owner step:** …`, `**PRD refs:** …`), and fields do
  too; they render as one paragraph.
- `RoadmapOverview` renders `RoadmapProgress` and the status pills in the card body; `SectionCard` already has an
  `action` slot (shadcn `CardAction`, right of the title).
- `FoldRow` (theme-notion) is a native `<details>` with the `group/fold-row` class, so the summary can unclamp the
  outcome when open (`group-open/fold-row:line-clamp-none`) without client state.

## Options
1. Strip HTML comments in the parser; split inline `**Label:**` parts out of the outcome and the fields; treat
   `Owner step` as a highlighted part; fold `Change`/`Depends on` into the named facts; short single-line fields
   go to the details table, long ones to paragraphs. Chosen.
2. Render the item's markdown with a full markdown renderer: brings HTML handling and a new dependency for a view
   that only needs the shapes `softure-roadmap` writes. Rejected.
