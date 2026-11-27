---
change_id: answer-done-by-issue-number
title: "An answer is done when its own issue is closed, whatever its labels"
status: archived
roadmap_item: null
branch: claude/project-thread-ujv1lt
created: 2026-11-27
updated: 2026-11-27
archived_at: 2026-11-27
---

## Intent
An answer COCKPIT sent is `done` as soon as its own issue (by number) is closed, whatever labels that issue carries.
Answers whose issue lost the `cockpit` label (or never had it) leave the "waiting" reading of the inbox history once
their issue is closed. Source: issue #166.

## Context
`buildInbox` (`src/inbox/build-inbox.ts`) decides `done` from the closed issues of the scan's stored read, and the scan
lists only issues labelled `cockpit` (`listCockpitIssues`). Answers created while the label was `owner-word` never
appear in that list, so they stay `sent` for ever. Measured on 2026-11-27: nine such answers across three watched
repositories, every issue closed as completed within a day.

## Constraints
- No backward-compatibility path for the old label: the label query stays `cockpit` only.
- COCKPIT stays read-only toward watched repositories: the new read is one GET per answer not yet done.
- A forward-only migration that says how to roll back.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: the issue names the cause, measured, and the expected behaviour; nothing to challenge.

## Done
- Closure stored and read in 84ad21f; gates green (984/984); e2e is the PR's `ci` job.
