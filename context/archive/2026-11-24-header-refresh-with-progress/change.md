---
change_id: header-refresh-with-progress
title: "A header bar with a refresh of every project and its live progress"
status: archived
roadmap_item: CT-9
branch: claude/project-thread-4nbu2x
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
Every screen gets a header bar above the page, in the style of the other SOFTURE apps' top bar (a bordered row with
the menu button on a phone). On its right sits a refresh control: a "Refresh" button that starts a scan of every
watched project, and next to it what the scan is doing. While the scan runs it shows a spinner and a live counter
("2 of 5 refreshed") with a progress bar; when it is idle it shows when the projects were last read. When the scan
ends the page reloads its data.

## Context
The owner asked for it in the thread (2026-11-24, translated): "add a header with a menu, as in the trip planner, with
the refresh button on its right and a nice loader while the projects refresh, since that happens asynchronously:
1 of 5 refreshed, 2 of 5 refreshed, counting up, and the last read time". The screenshot showed the "Refresh list"
control on Settings → Watched repositories. The coordinator added it to cockpit-v3 as CT-9.

## Constraints
- Build on `@softure-ai/jobs` (the scan's `reportProgress`, `listRecentJobs`) and `@softure-ai/theme-notion`
  (`Button`, `MiniProgress`, `SidebarTrigger`); no migration, no new package.
- Read-only toward the watched repositories (NFR-7): the button only queues the existing scan.
- Copy through `messages/en.ts` and `messages/pl.ts`; the progress route checks the signed-in user.
- No release or deploy (the coordinator deploys at the end).

## Notes
- frame skipped: the owner named the problem and the expected look.

## Done
- Merged as one pull request; rides the next release (the owner's word).
