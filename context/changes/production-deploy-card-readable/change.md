---
change_id: production-deploy-card-readable
title: "The Deploy block on the Production tab reads at a glance, its states in their colours"
status: plan_reviewed
roadmap_item: null
branch: claude/project-thread-mj0udr
created: 2026-11-24
updated: 2026-11-24
---

## Intent
On a project's Production tab, the Deploy block shows the version in production and the last deploy as two clear
cards instead of one row of grey pills: the version stands out, each step of the last deploy (deploy, verification)
carries its state in its colour and icon (passed green, skipped amber, failed red, cancelled grey, running blue), and
the link to the run sits where it belongs.

## Context
The owner reported the block as ugly and hard to read from production: "In production: v…", "Deploy passed" and
"Verification skipped" render as grey tag badges in one wrapping row with the times and the link
(`src/adapters/deploy/deploy-details.tsx`). A passed deploy shows grey, not green.

## Constraints
- Design-system pieces and tokens only (`@softure-ai/theme-notion` Badge, palette colour tokens), no raw colours.
- The deploy state, its read and its messages' meaning stay as they are; only the presentation changes.
- No release, tag, publish or deploy.

## Notes
- Research skipped: the presentation lives in one component and its two message dictionaries; the data shape
  (`DeployState`) is unchanged.
- Frame skipped: a visual defect reported by the owner; the outcome is not in doubt.
