---
change_id: scan-navigation-spec-counts-requests
title: "The Scan status navigation spec counts the requests a click causes instead of timing them"
status: archived
roadmap_item: null
branch: claude/project-thread-iqvmvw
created: 2026-11-26
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
`e2e/scan-status-navigation.spec.ts` "after Scan now the sidebar still leaves Scan status when the next page answers
slowly" fails only when a refresh replaces the navigation, never because the machine is slow.

## Context
It failed on PR #142 in "e2e under load" (run 45799863582, job 139839968988): the Projects heading was not visible
within 12 s (4 slow answers of 3 s), the page still on Scan status. Since PR #142 `pressScanNow` waits until the page
shows Scan now's answer, so the click now always lands while a scan runs and the page refreshes itself.

Request logs with `/projects` answers delayed by 3 s:

- From Settings (no refresh loop at all): the click's request, answered at 3 s, then a second request for the rest of
  the page's data; the heading shows at about 6.4 s. The router always takes two round trips to a page it has not
  seen, so the spec's budget assumed one answer where there are two.
- From Scan status with a scan running, current code: the same two trips (the refresh queued meanwhile rides along
  with the second trip as a parallel request), heading at about 6.4 s, three requests.
- From Scan status with the code before PR #130: the first trip arrives, then every 2 s a new refresh replaces the
  second trip; 14 requests in 30 s and the heading never shows.

So the app is right; the spec's time budget was wrong by one round trip and, under load, by the server's own time.

## Constraints
- No retries. The assertion stays able to catch the bug: it counts requests (at most 3 for one navigation; the bug
  makes one every 2 s for as long as the scan runs) and still demands that the page arrives.

## Notes
- Research and frame skipped: the request logs above are the investigation; the cause is in the spec.
- A client-side guard that stops Scan status's refresh once a link is clicked was tried and dropped: it changed
  nothing in the logs (the queued refresh never starts a trip of its own).

## Done
- Spec fix in ebdb752; full e2e 89/89 (default workers once, 4 workers twice).
