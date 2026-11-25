---
change_id: project-history-as-tabs
title: "Project history in tabs with icons, and one tab pattern for every multi-section screen"
status: archived
roadmap_item: CT-21
branch: claude/project-thread-3okqon
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
A project's history page shows its sections as tabs (CI, Quality review, Merges, Releases, Doctor), each with its
icon and count, the shown tab in the address, the same `TabBar` as the project page and the inbox; inside each tab
the rows are laid out cleanly with a state icon per row (passed, failed, running for runs; merged for merges; the
release state for releases; the finding's severity for the doctor). The tab bar setup (labels, icons, counts, the
tab in the address, touch sizes) becomes one shared piece used by every screen with several sections, so the
pattern is applied app-wide, not only on the history page.

## Context
The owner (2026-11-25 13:59 Warsaw, translated, with a screenshot of the history page): "the whole history view on
tabs, with the right icons, and lay it out properly". On master (6286205) the history page
(`app/(app)/projects/[owner]/[name]/history/page.tsx`) stacks `DoctorSection`, `RunsSection` (CI and quality review
side by side, the quality review column mostly empty), `MergesSection` and `ReleasesSection`
(`src/project-page/history/history-sections.tsx`) one under another. The project page
(`app/(app)/projects/[owner]/[name]/page.tsx`, `src/project-page/project-tabs.ts`, CT-5) and the inbox
(`app/(app)/inbox/page.tsx`) already use `@softure-ai/theme-notion` `TabBar`, each wiring it on its own.
Audit for other screens that stack several sections: Broadcast (`app/(app)/broadcast/page.tsx`: "New broadcast" and
"Sent" cards) and Settings → Team (`app/(app)/settings/team/page.tsx`: members and invite cards).
Settings itself (repositories, team link, account) and Scan status (schedule line and project list) stay single pages:
their first section is short and the rest is reached in one scroll.

## Constraints
- One shared tab helper (`src/shell/page-tabs.tsx` or similar) over `TabBar`; the project page and the inbox move onto
  it in the same change, without visual change.
- CI and quality review become two tabs; an empty tab says so in one line instead of an empty column.
- Row state icons from the theme's `Status` (icon plus word), the same colour meaning as the rest of the app; CT-18
  later moves these rows onto its shared row without changing what they say.
- Each tab reads only its block (a failed read shows in its tab, the others still show).
- e2e selectors (`data-*`) stay; copy in both message dictionaries.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: the owner described the target with a screenshot; the outcome is not in doubt.
