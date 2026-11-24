# Research: project-page-sections-as-tabs

## Today
- `app/(app)/projects/[owner]/[name]/page.tsx` stacks, below the read status line and the read failure notice:
  `EntriesSection` (first when it has entries, last otherwise), `RoadmapSection`, `QueuedSection`,
  `ChangesSection` (or one `EmptyState` when no state was read), a `production` `SectionCard` with
  `HealthDetails` and `DeployDetails` (only when one of them reports), and `WakeDetails` (a card, only when the
  project's workflow file was read).
- Every section is a `SectionCard` (`src/shell/section-card.tsx`), a named region; the e2e find them by name
  ("Waiting for you", "Active roadmap", "Queued roadmaps", "Health", "Deploy", "Owner-word issues").
- The answer form (`src/inbox/answer-form.tsx`) posts a server action that calls `revalidatePath("/", "layout")`;
  the page re-renders on its own address, query string included, so a tab kept in the address survives a submit.

## The tab pattern
- `@softure-ai/theme-notion` 0.31.0 exports `TabBar({ label, tabs, current, size, tabClassName })`, tabs
  `{ key, label, href, icon?, count? }`: a `nav` of links with `aria-current="page"` on the shown tab, the count in
  a `data-slot="tab-bar-count"` chip; `size="touch"` makes every link at least 44 × 44. This is the theme's tab
  pattern for a screen's tabs ("the shown tab in the address; `Tabs` keeps it in client state"), so it answers the
  owner's "see how we do such tabs". COCKPIT uses it nowhere yet; no gap found.
- Next.js 16 pages receive `searchParams` as a promise, like `params`.

## Tests touched
- `e2e/project-page.spec.ts` (sections by region name, the answer from the page, the "Waiting for you first" check),
  `e2e/deploy.spec.ts` and `e2e/health.spec.ts` (regions "Deploy" and "Health" in the production card),
  `e2e/wake.spec.ts` (region "Owner-word issues"), `e2e/polish.spec.ts` (no English copy on the default tab).
- Unit tests live under `tests/project-page/`; the choice of tabs and of the default tab is pure and testable there.

## Answers to the unknowns
- Pattern: `TabBar` of the theme (above). Yes.
- Tabs and order: Waiting, Roadmaps, Changes, Production (Production only when health or deploy reports). The wake
  card explains what picks up an answered entry (an owner-word issue), so it sits in the Waiting tab below the
  entries instead of staying a box above the tabs (fewer boxes, which is the owner's point).
