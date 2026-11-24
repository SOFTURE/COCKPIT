---
change_id: roadmap-open-after-tab-load
title: "The project-page e2e clicks a roadmap link only after its tab's page has loaded, and CI prints the page at a failure"
status: archived
roadmap_item: null
branch: claude/project-thread-v9mlm0
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
The `ci` job `e2e` on master passes "e2e under load" without the roadmap-page open failing now and then, and any
future e2e failure shows the page snapshot in the job log.

## Context
Master `ci` runs 45416146448 (dd7f81d) and 45420682299 (3f602ae) failed at the same step: after the project page's
Roadmaps tab, the "Omicron v2" link was clicked and its heading never showed, even within 15 s (`roadmap-open-waits-under-load`
raised the bound, which did not help). A tab is a plain link, so its click loads a whole document; the roadmap link is
a client link clicked right after, possibly before the page has loaded. Reproduced locally once in about five full runs
under 4 workers; the exact cause was not captured because the CI artifact cannot be downloaded from the agent's
environment and the local repro did not recur with a trace.

## Constraints
- No retries, no assertion loosened, no product code change.

## Notes
- Research skipped: the two failing logs, the local runs and the handover from the thread that looked at it first are
  the investigation, recorded above.
- Frame skipped: the outcome (green master) is the owner's standing order.

## Done
- `openTab` in `e2e/project-page.spec.ts` clicks a tab, waits for it to be current and for the new document to load.
- Each roadmap open asserts its URL before its heading, so a lost click and a slow page fail differently.
- `ci.yml` prints every `error-context.md` when the e2e job fails.
