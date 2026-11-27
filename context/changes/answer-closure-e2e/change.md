---
change_id: answer-closure-e2e
title: "End-to-end test: an answer turns done once its issue is closed without the cockpit label"
status: plan_reviewed
roadmap_item: null
branch: claude/project-thread-p835tc
created: 2026-11-27
updated: 2026-11-27
---

## Intent
Prove in the built app, before the release that carries #166 (PR #167), that an answer whose own issue was closed and
lost the `cockpit` label shows "Done" in the inbox after the next scan. Today only unit tests cover it: the fake forge
never closes an issue and cannot answer a read of one issue by its number.

## Context
The scan reads an issue by number (`src/forge/issue-state.ts`) when it is not in the labelled list, and stores the
closure on the answer (`projects.answers.issue_closed_at`, migration 0012). The e2e fake forge (`e2e/fake-forge.ts`)
lists created issues by label, always open; no spec reaches the "done" state of an answer.

## Constraints
- Test-only change: no app code changes unless the test finds a bug.
- The spec shares the database with the others: a fixture repository no other spec uses, assertions on its row only.
- No release, tag, publish or deploy from this change (the release thread does that after its merge).

## Notes
- Research skipped: the code path is known from #166 / PR #167 (archived change answer-done-by-issue-number).
- Frame skipped: a missing test before a release, nothing to challenge.
