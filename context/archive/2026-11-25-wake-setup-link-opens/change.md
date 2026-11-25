---
change_id: wake-setup-link-opens
title: "The wake routine setup link opens the routine's setup steps"
status: archived
roadmap_item: null
branch: claude/project-thread-ti64x3
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
On a project page, the "Set up the wake routine" button of the cockpit issues card opens the setup steps of the wake
routine instead of a GitHub "page not found".

## Context
The owner reported that the button leads nowhere. It links to
`https://github.com/SOFTURE/SKILLS/blob/main/routines/cockpit-wake.md#setting-it-up`, but the skills repository's
default branch is `master`: the `main` URL answers 404, the `master` URL answers 200 (checked from the production
server, 2026-11-25). The link was introduced with `main` and kept it through the rename to `cockpit-wake.md`.

## Constraints
- The link points at the routine file shipped with `@softure-ai/skills` 0.39 (`routines/cockpit-wake.md`, section
  `## Setting it up`); the skills repository is not changed.
- No release, tag, publish or deploy.

## Notes
- Frame skipped: a broken link with a measured cause; the outcome is not in doubt.
