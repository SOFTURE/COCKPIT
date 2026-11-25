---
change_id: broadcast-count-under-a-growing-list
title: "The broadcast picker counts only the projects it shows, and its e2e holds while other specs watch repositories"
status: plan_reviewed
roadmap_item: null
branch: claude/project-thread-9k6lgp
created: 2026-11-25
updated: 2026-11-25
---

## Intent
Master CI is green again after the broadcast picker change: the "e2e under load" step no longer fails when another
spec watches a repository while the broadcast spec is picking projects, and the picker's count never includes a
project that is no longer in the list.

## Context
Master CI run 45579312960 (merge db9dfff) failed in "e2e under load" (`--workers=4`): `pickOwnProjects` read the
number of checkboxes once (6), another spec watched a seventh repository, the page re-rendered, and the final
assertion expected "3 of 6 picked" while the page showed "3 of 7 picked". The same pass on the pull request was green
only because the timing differed. The form also derived its count from the size of the picked set, which can hold a
key from an earlier list.

## Constraints
- Never loosen what the test proves: clear all, pick all, the disabled send button and the final pick are still
  asserted.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: a red master with a known cause.
- Research kept short: the cause is in the failing job's printed page snapshot and the spec's own source.
