---
change_id: deferred-entries-leave-waiting
title: "Inbox: an entry the owner put off leaves Waiting for you, and the answer issue tells the project how to settle it"
status: archived
roadmap_item: null
branch: claude/project-thread-dhv37e
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
An owner-queue entry the owner answered "later" stops counting as waiting once its project has recorded the answer
(WORKFLOW §8.6: the entry stays in the queue with `(later: #N)`): the inbox and the project page show it apart, as
put off, with a link to the issue, and never ask for it again as if it were new. The cockpit issue an answer
becomes tells the project, in its own words, how to settle the entry so it leaves the owner's list.

## Context
The owner answered two entries of a watched project from COCKPIT: one "later", one "yes". The project's cockpit
wake routine picked both up. For "later" it re-worded the source line to `start queued roadmap X: once the current app
is stable (later: #892)` and closed the issue, exactly as §8.6 says. COCKPIT then matches answers on entry id and
text, sees new text, and would show the entry as open again with "the entry changed since your answer", asking the
owner a second time. For "yes" the project could not finish the step itself (it needs the owner), commented that, and
left the issue open; COCKPIT shows "Sent". That half needs a contract in SOFTURE/SKILLS (how a project hands an owner
step back) and is filed there, not guessed here.

The list is derived only from each project's `context/state.json` `owner_queue` (last good scan) and its cockpit
issues: COCKPIT keeps no list of its own, so a settled entry (ticked done or declined) leaves it on the next scan.

## Constraints
- Read-only toward watched repositories (NFR-7); the only write stays the cockpit issue.
- No release, tag, publish or deploy.
- A deferred entry can still be answered (the owner may change their mind): its answer form stays.

## Notes
- Research kept short: three files (`build-inbox.ts`, `inbox-row.tsx`, `forge/issues.ts`) and the watched project's
  issues are the investigation; findings in `research.md`.
- Frame skipped: the owner's report and §8.6 state the expected behaviour.

## Done
- Entries put off with `(later: #N)` leave "Waiting for you": shown apart as put off, not asked again; the answer issue
  tells the project how to settle the entry (SOFTURE/SKILLS#89 and #90 filed for the rest).
