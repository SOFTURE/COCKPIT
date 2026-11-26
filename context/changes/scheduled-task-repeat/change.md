---
change_id: scheduled-task-repeat
title: "A scheduled task that repeats"
status: plan_reviewed
roadmap_item: CT-39
created: 2026-11-26
updated: 2026-11-26
---

## Intent
The dialog's "Repeat" choice (No, Daily, Weekly) makes a task fire again at the same local time; after each run the task stays in the Scheduled tab with its next time, each run lands in Done, and a menu item pauses or resumes it.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-39: A scheduled task that repeats
- **Change ID:** `scheduled-task-repeat`
- **Status:** ready
- **Outcome:** the dialog's "Repeat" choice (No, Daily, Weekly) makes a task fire again at the same local
  time; after each run the task stays in the Scheduled tab with its next time, each run lands in Done, and a menu item
  pauses or resumes it.
- **Prerequisites:** CT-38.
- **Touches (estimate):** `modules/projects/migrations/0011_add_scheduled_task_repeat.sql` (new; `repeat`, `paused`),
  `modules/projects/scheduled-tasks.ts`, `src/scheduled/**`, `app/(app)/scheduled/**`, `messages/en.ts`, `messages/pl.ts`
  (own block), `tests/scheduled/**`, `e2e/scheduled.spec.ts`.
- **Size:** M
- **Rules:** the next time is the next local date-time after the run's planned time (not after "now") in the app's
  time zone, computed with core's local date-time helpers, so 08:00 stays 08:00 across a DST change; a run missed by
  more than one period fires once, not once per missed period; a paused task does not fire and shows "Paused".
- **Unknowns:** none.
- **Risk:** a wrong next time could fire twice in one period; the claim and a unique (task, planned time) run key guard it.
- **Baseline:** after CT-38 every task fires once; after: weekly and daily tasks.
- **Layout:** in the dialog, under "When", a `RadioGroup` in one row ("No", "Daily", "Weekly on <day>");
  a scheduled row's muted line gains "· weekly" and its time badge shows the next run; the menu gains "Pause"
  or "Resume" above the separator; a paused row's badge is grey "Paused".
- **Verification:** unit tests: the next time for daily and weekly across both 2026 DST changes in Europe/Warsaw, a
  missed period fires once, pause and resume. Integration test: a weekly task fires, gets its next time and fires
  again with the clock moved a week, one run each, one issue per project per run. e2e at 1280 and 390 px: create a
  weekly task, Run now, the row stays in Scheduled with the next time and the run shows in Done; pause and resume.
  Screenshots of the dialog with the repeat choice and of a repeating and a paused row at 1280 and 390 px, light and
  dark, saved with `softure-evidence` and linked from the plan's Progress; the run looks at each one itself before
  READY. All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-8
- **Input:** context/changes/scheduled-task-repeat/change.md

Findings gathered while recording it (master b92aa7d):
- Owner, 2026-11-26 10:46Z (F-8, translated): scheduled tasks: set the date when a prompt fires as an issue in the
  chosen repositories (example: a code-quality check across chosen projects on Monday after the token allowance
  resets, run by itself); a separate tab in the left menu, by the app's existing standard (tabs, a dialog).
- The jobs package's own schedules compute local times with DST in mind (`at` + `timeZone`); the app's next-run rule uses core's local date-time helpers in the same way.

## Constraints
- Owns lane L's files and `modules/projects/migrations/0011_*`.
- Starts once CT-38 is merged.
- The roadmap's binding layout rule for CT-37..CT-39 (section "Slices").
- Build on the `@softure-ai/*` packages (AGENTS.md "SOFTURE packages first"); a missing piece becomes an issue in
  SOFTURE/AI right away, never a local wrapper or override.
- Design tokens only, no raw colours; user-visible text, `aria-label` included, through `messages/en.ts` and
  `messages/pl.ts` (each item adds its own block); on a phone controls are at least 44 px.
- COCKPIT's only write to watched repositories stays the cockpit issue (AGENTS.md "Access to watched repositories").
- Fixtures, screenshots and test data are fictional (AGENTS.md "Open source and generic").
- No release, tag, publish or deploy without the owner's word.
- Every CI job green before the merge; master CI checked green after it. A test that fails once and passes on a rerun
  is a bug to fix in the same thread.
- Any problem found in a SOFTURE package or skill is filed in SOFTURE/AI (or SOFTURE/SKILLS) right away; skills are not
  touched.

## Notes
- Frame skipped: the owner's explicit feature, with the split recorded in the roadmap.
