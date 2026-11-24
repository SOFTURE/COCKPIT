# Research: header-refresh-with-progress

- The scan is a job on the queue `cockpit.scan` (`src/scan/scan-queue.ts`), run by the schedule and by "Scan now"
  (`app/(app)/scan-status/actions.ts` → `queueScan` → `runScheduleNow`, which joins a waiting run or queues one
  follow-up). `scanProjects` (`src/scan/scan-projects.ts`) reads the watched projects one by one and records each read
  (`recordRead`, `readAt`).
- `@softure-ai/jobs` (installed) already carries progress: the handler context has
  `reportProgress({ step, done, total })` (code-only, at most one write per second, a report inside the second is
  kept for the next one), and `listRecentJobs(ctx, { statuses, queue, limit })` returns `Job.progress`. So the counter
  needs no table of its own and no in-process state (the worker and the request may be different module instances).
- The last read time: the newest `readAt` in `findReads` (`modules/projects/reads.ts`), the same fact Scan status
  shows per project.
- The shell (`src/shell/app-shell.tsx`) has no header bar: on a phone a row with `SidebarTrigger`, on a desktop
  nothing above the page. The layout (`app/(app)/layout.tsx`) loads the inbox and the overview for the sidebar on
  every request.
- The reference app's shell (the trip planner, `src/components/shell/AppShell.tsx`): a `<header>` row,
  `flex items-center gap-2 border-b border-border px-2 py-1`, with the menu button (phone) and a sync status line
  ("refresh" icon + text, muted). Its refresh status uses `RefreshCwIcon` with the theme's `ICON_STROKE_WIDTH`.
- Settings' "Refresh list" (the screenshot) rereads the token's repository list, not the projects; it stays where it
  is. The header's button refreshes the projects (a scan).
- e2e: `e2e/scan-until-settled.ts` presses "Scan now" on Scan status; the header button is a second button with a
  different name ("Refresh"), so nothing collides. API routes authenticate with `getCurrentUser` from
  `@softure-ai/auth/next`.
