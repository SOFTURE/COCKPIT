---
change_id: broadcast-pages-load-fast
title: "The broadcast pages open at once, a broadcast sends in parallel, and its list rows sit on the design grid"
status: planned
roadmap_item: null
branch: claude/project-thread-3hfz3n
created: 2026-11-24
updated: 2026-11-24
---

## Intent
Opening Broadcast or one sent broadcast is as fast as any other screen, sending a broadcast to a dozen projects does
not hold the page for half a minute, and the broadcast lists have the padding the rest of the app uses.

## Context
The owner reported, on production with twelve watched projects, that the Broadcast tab and the page of one broadcast
load very slowly, and that the history row looks crooked (text flush against its hover background, no spacing).
- The pages themselves read only COCKPIT's tables (no forge call): locally every route renders in 30 to 90 ms.
- Every screen's sidebar and lists are `next/link` links, which a production build prefetches as they enter the
  viewport. A local page view of `/broadcast` fired 18 prefetch requests (each nav item and each watched project,
  twice). Each one renders the whole app layout (sign-in check, inbox, overview, scan progress: five or six queries).
  With twelve projects that is about 40 full renders behind every click, on a 10-connection pool on a shared,
  swapping server; the reverse proxy shows prefetches of `/broadcast`, `/inbox` and `/projects` cancelled after 23 to
  27 seconds. The prefetched results are not even used: the click fetches the page again.
- `sendBroadcast` sends to the picked projects one after another (two or three forge calls each) inside the form's
  action, so the redirect to the new broadcast waits for all of them: about 13 × 1.5 s.

## Constraints
- No release, tag or deploy (the coordinator deploys everything at the end).
- Exactly one issue per project per broadcast stays guaranteed (claims and markers unchanged).

## Notes
- Frame skipped: the causes are measured (local timings and prefetch count, the proxy's log on the server).
- The SOFTURE/AI wake status ("waits for the next run") is right for its `context/workflow.json`, which does not
  declare `autonomy.ownerWordWake`; the fix belongs in that repository, through its own chain (prompt to the owner).
