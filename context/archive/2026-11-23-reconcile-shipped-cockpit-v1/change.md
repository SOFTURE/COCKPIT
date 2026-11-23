---
change_id: reconcile-shipped-cockpit-v1
title: "The context says what actually shipped from cockpit-v1"
status: archived
roadmap_item: null
branch: claude/project-thread-rl83uq
created: 2026-11-23
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
The archived roadmap cockpit-v1 and the owner's queue match what runs in production: every item whose code
shipped is `done` with its release tag, every owner step that happened is ticked with its evidence, duplicates are
merged, and only what truly waits for the owner stays open.

## Context
Owner input (2026-11-23, translated): COCKPIT is deployed (releases v2026.11.23 to v2026.11.23-5, green deploy
runs), but the context still shows `done_code (waiting: release)` rows and owner-queue entries that are already
done; verify each against the forge and the running app, set shipped rows to `done` with the release tag, settle
done entries, merge duplicates, keep only what truly waits, close the roadmap, regenerate `state.json`, doctor
clean; never release, tag, publish or deploy.

cockpit-v1 was already closed and archived on 2026-11-23 (PR #44,
`context/foundation/archive/2026-11-23-roadmap.md`); its still-open steps were copied into cockpit-v2's
`## Before the next release`, which is where the owner queue reads them now.

## Constraints
- Context files only; no source code, no release, tag, publish or deploy.
- Every tick cites forge evidence (release tag, run id, log line).

## Notes
- Research skipped: the evidence is the forge's releases and workflow runs, listed in `plan.md`.
- Frame skipped: a bookkeeping change asked for word by word.
