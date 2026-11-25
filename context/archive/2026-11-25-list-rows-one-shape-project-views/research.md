# Research: list-rows-one-shape-project-views

Master at 9a26b6c (CT-17, CT-18, CT-21 merged).

## The shared pieces (CT-18)
- `src/shell/list-row.tsx` `ListRow`: `li` with identity left (`title`, `titleAside`, `details`), right column
  (`data-row-side`) with `status` on top and `actions` under it; `href` stretches the title link over the row
  (`after:absolute inset-0`) and lights it on hover; the right column is `relative`, so it sits above the overlay.
  Anything in `details` that must stay clickable needs its own `relative` box, or it sits under the overlay.
- `src/shell/result-badge.tsx` `ResultBadge`: filled tag in the theme tone's colour (`success` green, `danger` red,
  `warning` orange, `muted` gray) with an icon and a word; `data-result=<tone>`.
- `e2e/expect-row-state.ts` checks the state sits on top of the right column at 1280 and 390 px.

## Lists still on their own layout
| Screen | File | Today |
| --- | --- | --- |
| Overview | `src/overview/overview-row.tsx` | link on the name only; status and drift beside it; property chips (roadmap, queued, open changes, waiting, release, doctor, health, wake, CI, quality review) in a line under it; read time last |
| Inbox, project page entries | `src/inbox/inbox-row.tsx` | own two-column grid; answer state as `Status` (done green, sent blue, sending gray, deferred gray) |
| Inbox "answered earlier" | `app/(app)/inbox/page.tsx` | inline `li`, `Status` done/sent |
| Project page roadmap items | `src/project-page/project-page-sections.tsx` `RoadmapItemRow` | ID tag, outcome, status pill right; details indented |
| Project page queued roadmaps | `QueuedRow` | lit link row (`ROW_SURFACE_CLASS`) with progress right |
| Project page changes | `ChangeRow` | stage tag beside the title, link and facts under it |
| History CI / quality review | `history-sections.tsx` `RunRow` | result first on the left, link after it |
| History merges, releases | `MergeRow`, `ReleaseRow` | link first, state under it, no right column |
| History doctor findings | finding `li` | code badge first |
| Deploys | `src/adapters/deploy/deploys-list.tsx` | link on the name, release/production/result tags in a line under it |
| Packages | `src/adapters/packages/packages-details.tsx` | version rows with the behind/current tag inline; held packages inline |

Not rows of a list (left as they are): `settings-row.tsx` (a setting with one control; CT-17 owns its hint),
roadmap view bullet lists (`roadmap-view.tsx`), drift explanations, secret names, the broadcast form's checkboxes,
`StatusActionFoldRow` (CT-11, the fold-row variant of the same shape).

## Result colours still outside the map
`src/status/state-colors.ts` returns palette names: run/deploy result passed green, failed red, running **blue**,
cancelled gray; doctor ok green, failing red, pending **blue**; health healthy green, unhealthy red, unknown gray;
package current green, behind orange. CT-18's map has no blue: pending is gray. Chips render `Badge` directly with
these colours (`data-tone=<colour>`, read by e2e in overview, health, deploys, packages, deploy specs).
The history tab uses `Status` with its own `RUN_LOOKS` (running blue), releases purple/yellow/green, merges purple.

## Tests that read these rows
- e2e: `overview.spec.ts` (data-tone on doctor/CI chips), `health.spec.ts`, `deploys.spec.ts`, `packages.spec.ts`,
  `deploy.spec.ts` (project-page deploy card, `deploy-details.tsx`, not a list: stays), `inbox.spec.ts`,
  `answer.spec.ts` (44 px controls and no sideways scroll at 390 px), `project-page.spec.ts`,
  `project-history.spec.ts`, `drift.spec.ts`, `ci-from-pull-request.spec.ts`.
- unit: `tests/status/state-colors.test.ts` pins the colours; `tests/inbox/inbox-row-markup.test.tsx`.

## SOFTURE packages
No change needed in `@softure-ai/theme-notion`; the generic row gap is SOFTURE/AI#1481 (filed by CT-18).
