---
change_id: bump-softure-skills-0-41-2
title: "The project runs on @softure-ai/skills 0.41.2"
status: archived
roadmap_item: null
branch: claude/nice-hypatia-mpft28
created: 2026-11-27
updated: 2026-11-27
archived_at: 2026-11-27
---

## Intent
`@softure-ai/skills` moves from 0.41.1 to 0.41.2 (the newest published version), as cockpit issue #163 orders, and
`context/state.json` is regenerated with the new doctor in the same pull request.

## Context
Since 0.41.2 a queued roadmap is listed only under `queued` and is no longer an `owner_queue` entry. The only file the
install changes besides the manifests is the installed doctor script `context_state.py`; the `context-doctor` CI job pins the same version.

## Constraints
- Nothing else changes (#163). No release, tag, publish or deploy.

## Notes
- Research skipped: the package diff (one script) and the regenerated state are the whole investigation.
- Frame skipped: the outcome is fixed by the cockpit issue.

## Decisions (auto)
- `context/state.json` is regenerated with `context_state.py write`; it comes out byte-identical, because the queued
  roadmap `later` was never an `owner_queue` entry here, so the file stays untouched.

## Done
Skills 0.41.2 installed; doctor green; `owner_queue` unchanged (5 entries, CMP-12, CMP-18, CMP-20, CMP-21, CT-10).
