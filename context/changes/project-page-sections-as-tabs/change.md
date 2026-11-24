---
change_id: project-page-sections-as-tabs
title: "The project page shows its sections as tabs"
status: planned
roadmap_item: CT-5
created: 2026-11-24
updated: 2026-11-24
---

## Intent
the project page shows its sections as one tab bar instead of stacked boxes: "Waiting" with the number of entries waiting for the owner, "Roadmaps" with the active and queued roadmaps and their number, "Changes" with the open changes and their number, and "Production" with health and deploy, each tab with an icon; the tab bar is the theme's `TabBar` (links, so a tab has its own address and the back button works), the same pattern as the other SOFTURE apps; the first tab with something in it opens by default; on a phone the tabs are touch-sized.

## Context
Roadmap item (cockpit-v3), quoted:

> ### CT-5: The project page shows its sections as tabs
> - **Change ID:** `project-page-sections-as-tabs`
> - **Status:** ready
> - **Outcome:** the project page shows its sections as one tab bar instead of stacked boxes: "Waiting" with the
>   number of entries waiting for the owner, "Roadmaps" with the active and queued roadmaps and their number, "Changes"
>   with the open changes and their number, and "Production" with health and deploy, each tab with an icon; the tab
>   bar is the theme's `TabBar` (links, so a tab has its own address and the back button works), the same pattern as
>   the other SOFTURE apps; the first tab with something in it opens by default; on a phone the tabs are touch-sized.
> - **Prerequisites:** —
> - **Touches (estimate):** `app/(app)/projects/[owner]/[name]/page.tsx` (the tab bar and the selected tab from the
>   address), `src/project-page/**` (sections become tab panels, counters), `messages/en.ts` and `messages/pl.ts`
>   (own keys).
> - **Size:** S
> - **Unknowns:**
>   - Is `TabBar` of `@softure-ai/theme-notion` the pattern the owner means by "how we do such tabs"? Recommended:
>     yes, it is the theme's tab component with icons and counters; a gap in it goes to SOFTURE/AI. (owner: research;
>     blocks: no)
>   - Which tabs and in what order: the four above, with the wake status staying above the tabs? (owner: research;
>     blocks: no)
> - **Risk:** an answer form inside the "Waiting" tab must keep working after a submit (the page reloads on the same
>   tab); the e2e of CMP-5 and CMP-9 guard it.
> - **Baseline:** today the page stacks four boxes (the owner's screenshot of 2026-11-24); after: e2e opens a
>   fictional project with five entries and one queued roadmap, sees the tabs "Waiting 5" and "Roadmaps 1", switches
>   tabs by link, answers an entry from the "Waiting" tab; screenshots at 1280 and 390 px, light and dark.
> - **PRD refs:** F-5, FR-10
> - **Input:** context/changes/project-page-sections-as-tabs/change.md

Findings gathered while recording it (2026-11-24):
- The owner's input (2026-11-24 09:04 Warsaw, translated): "add to the current roadmap that this view is in the
  form of tabs (with icons and these counters, as now: waiting 5, roadmaps 1); see how we do such tabs and do it
  identically on the project view; it will be more readable than these boxes". The attached screenshot shows the
  project page of a watched project with the boxes "Waiting for you 5" (five entries with Yes / No / Later),
  "Active roadmap" ("This project has no active roadmap.") and "Queued roadmaps 1" (one roadmap, "1 of 8 done").
- The tab pattern: `@softure-ai/theme-notion` (^0.31.0 in `package.json`) exports `TabBar`
  (`dist/notion/TabBar.d.ts`): `TabBar({ label, tabs, current, size, tabClassName })`, each tab
  `{ key, label, href, icon?, count? }`; its README: "`TabBar` (a screen's tabs as links with an optional icon …)"
  and "`TabBar size=\"touch\"` draws every tab link at least 44 × 44". The theme also ships Radix `Tabs`,
  `TabsList`, `TabsTrigger`, `TabsContent` (`dist/ui/tabs.d.ts`). COCKPIT uses neither yet.
- The page today (`app/(app)/projects/[owner]/[name]/page.tsx`): `EntriesSection` (above the rest when there are
  entries), `RoadmapSection`, `QueuedSection`, `ChangesSection`, a `production` `SectionCard` with `HealthDetails`
  and `DeployDetails`, and `WakeDetails`; sections live in `src/project-page/project-page-sections.tsx`.

## Constraints
- Owns exclusively (estimate): `app/(app)/projects/[owner]/[name]/page.tsx`, `src/project-page/**`.
- Shared, append only: `messages/en.ts` and `messages/pl.ts` (own keys in both).
- CT-3 waits for this item (both edit the project page).
- Read-only toward watched repositories (NFR-7); no release or deploy.

## Notes
- Frame skipped: the owner asked for this exact shape (tabs with icons and counts) and the theme already has the component.
