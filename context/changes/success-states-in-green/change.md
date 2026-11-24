---
change_id: success-states-in-green
title: "Every success state shows in green, and an idle project's moon in blue"
status: plan_reviewed
roadmap_item: null
branch: claude/project-thread-cr268t
created: 2026-11-24
updated: 2026-11-24
---

## Intent
Across every COCKPIT screen, a state that means "all good" reads green at a glance, a warning amber and a failure
red, instead of a neutral grey pill. An idle project's moon icon (sidebar and status word) is blue, not grey.

## Context
The owner reported the Packages view: "Current" is a grey pill next to the amber "Behind", and
asked for success states in green everywhere. A second message asked for the idle project's moon in blue. A sweep of
the badges found the same grey success in: the overview's CI and quality-review chips (passed), the doctor chip (OK),
the health chip (healthy), the Deploys list's last deploy (passed) and production version, and the Packages list's
current version. Badge colours are chosen in COCKPIT, not in `@softure-ai/theme-notion` (its Badge takes a `color`
prop), so the fix belongs to this repository; other SOFTURE apps choose their own colours.

## Constraints
- Palette colours of `@softure-ai/theme-notion` only, no raw colours; every state keeps its icon or word, so it never
  reads by colour alone.
- Neutral facts (counts, "no update", "unknown", "not read yet", cancelled) stay grey.
- The broadcast pages are edited by another thread and are not touched (their send status is already green on done).
- No release, tag, publish or deploy.

## Notes
- Frame skipped: a visual defect the owner reported; the outcome is not in doubt.
