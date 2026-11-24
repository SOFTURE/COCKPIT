---
change_id: repository-field-keeps-typed-text
title: "Settings: the Repository field keeps what was typed when the token's list arrives"
status: planned
roadmap_item: null
branch: claude/project-thread-v91hve
created: 2026-11-24
updated: 2026-11-24
---

## Intent
On Settings the Repository field is one mounted input from the first paint on: text typed (or an Add pressed) before
the token's repository list arrives survives its arrival, and the suggestions join the field when they come (#55).

## Context
`app/(app)/settings/page.tsx` streams the field: a Suspense fallback renders its own `AddRepositoryForm` with
`suggestions: loading`, and the streamed `AddRepositoryField` renders a second instance once the list is read. Two
instances, so the typed text is dropped on the swap, and while the streamed markup waits the page holds two
`Repository` fields. The list comes from a per-process cache (`repository-list-cache.ts`), so only the first visit after
a server start (or while no read has succeeded) waits for the forge. The e2e works around it by waiting for the listed
field (`e2e/submit-repository.ts`), which a person cannot do.

## Constraints
- No release, tag, publish or deploy.
- The acceptance is an e2e: type before the list arrives (a slow fake forge listing), the list arrives, the typed name
  is still there and adds.

## Notes
- Research skipped: the issue (#55) and the four files involved (`page.tsx`, `add-repository-form.tsx`,
  `repository-picker.tsx`, `repository-list-cache.ts`) are the investigation; findings in `research.md`.
- Frame skipped: the outcome is the owner's issue, with its expected behaviour stated.
