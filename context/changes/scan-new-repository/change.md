---
change_id: scan-new-repository
title: "A newly added repository is scanned at once and is not shown broken before its first read"
status: planned
roadmap_item: null
branch: claude/project-thread-sexkfb
created: 2026-11-23
updated: 2026-11-23
---

## Intent
A repository added in Settings gets its first read right away, and until that first read it is not shown as
broken. Today a project that was never read counts as "state cannot be read", so every repository added between
two scans shows a red "broken" mark in the sidebar, the overview, the digest and the MCP answers, although
nothing is wrong with it.

## Context
The owner added eight repositories in Settings a few minutes after a scheduled scan. All eight showed "broken"
while the one added before that scan read fine. Production data showed no read row at all for the eight
(`projects.reads`), green `context-doctor` and CI on their main branches and valid `context/state.json` files.
`buildOverview` passes `isStateRead: read?.status === "ok" && state !== null`, which is false when there is no
read yet, and the scan runs only on its schedule or on "Scan now".

## Constraints
- A read that happened and failed (no state, invalid, too old, not readable, unavailable) stays broken (FR-8).
- No migration.
- The owner allows a release of this fix; no deploy of other repositories.

## Notes
- Research skipped: the cause is fully visible in `src/overview/build-overview.ts` (`isStateRead`),
  `app/(app)/settings/actions.ts` (no scan after adding) and the production rows quoted above.
- Frame skipped: a misclassification reported from production; the outcome is not in doubt.
