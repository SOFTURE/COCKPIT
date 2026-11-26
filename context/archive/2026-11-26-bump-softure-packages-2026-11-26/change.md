---
change_id: bump-softure-packages-2026-11-26
title: "The app runs on the newest @softure-ai packages (2026-11-26)"
status: archived
roadmap_item: null
branch: claude/project-thread-3i6i40
created: 2026-11-26
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
Every `@softure-ai/*` package is on its newest published version, as the package-update routine
(`routines/package-updates.md`) describes, and the Polish panel stays Polish on the screens the new versions add.

## Context
Four packages move: `@softure-ai/auth` 0.2.23 → 0.2.24, `@softure-ai/mcp-access` 0.7.8 → 0.7.9,
`@softure-ai/theme-notion` 0.31.0 → 0.35.0, `@softure-ai/testing` 0.5.2 → 0.6.0. The rest are current. No held
packages, no owner steps (`routines.packageUpdates` absent), no open package-update pull request.

What the release notes ask of this app:
- auth 0.2.24: an app with its own `invitations` dictionary adds `revokeTitle`, `revokeTitleUnnamed`, `revokeBody`,
  `revokeConfirm` (the Revoke confirmation dialog).
- mcp-access 0.7.9: an app with its own translation adds `list.confirmTitle`, `list.confirmText`,
  `grants.confirmTitle`, `grants.confirmText`; no e2e here clicks Revoke or Disconnect.
- theme-notion 0.32: `FoldRow` insets its bar and content by `px-2` itself, so the app's override goes.
- theme-notion 0.33: dialogs focus their first field on open, so the app's `focusFirstField` handler goes.
- theme-notion 0.34/0.35 (`ListEntry`, `ResultBadge`, `RowActionsMenu`, `FoldRow` `status`/`actions`): the app's own
  equivalents (`src/shell/list-row.tsx`, `result-badge.tsx`, `row-actions-menu.tsx`, `status-action-fold-row.tsx`)
  keep working unchanged; replacing them is an app-wide UI rollout, which the owner's standing order sends to roadmap
  items of their own, not into this bump.
- testing 0.6.0: nothing to do (DOM tests are opt-in).

## Constraints
- No release, tag, publish or deploy: the bump rides the next release the owner orders.
- No change to SOFTURE code; no loosened test, guard or hook.

## Notes
- Research skipped: the four changelogs and the gates after the install are the whole investigation.
- Frame skipped: the outcome is fixed by the routine.
- Branch: the session may push only to `claude/project-thread-3i6i40`, so the routine's `claude/bump-softure-<date>`
  name is not used.

## Done
All four packages bumped; Polish copy for the new confirmation dialogs; two theme overrides the package now covers
removed. Adopting the theme's `ListEntry`, `ResultBadge`, `RowActionsMenu` and `FoldRow` columns is left to the
coordinator as roadmap work.
