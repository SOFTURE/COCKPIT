---
change_id: release-confirm-dialogs-tested
title: "The confirmation dialogs the package bump brought are pinned by e2e before the release"
status: open
roadmap_item: null
branch: claude/project-thread-xo03ry
created: 2026-11-26
updated: 2026-11-26
---

## Intent
Before the release that carries cockpit-v4 and the 2026-11-26 package bump, every behaviour the bump changed on a
COCKPIT screen is covered by an end-to-end test: revoking a pending invitation and revoking an MCP token both go
through a confirmation dialog, Cancel keeps the item, and the confirmed revoke takes effect.

## Context
The pre-release review of the batch (CT-22..CT-25, CT-29 and the bump of auth 0.2.24, mcp-access 0.7.9,
theme-notion 0.35.0, testing 0.6.0) found every roadmap item covered by unit and e2e tests (their impl reviews), and
one gap: the bump's archived change notes that no e2e clicks Revoke on an invitation or a token, although auth 0.2.24
and mcp-access 0.7.9 put both behind a new confirmation dialog. Neither package adds a migration in this bump
(auth stays at 0008, mcp-access at 0006).

## Constraints
- Tests only: no product code, no package change.
- Follow the shared-database rules of the e2e: own addresses and token names no other spec uses.

## Notes
- Research skipped: the gap and the package components were read directly (`@softure-ai/auth` `InvitationPanel`,
  `@softure-ai/mcp-access` `TokenManager`).
- Frame skipped: the owner's pre-release rule fixes the outcome.
