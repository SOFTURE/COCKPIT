---
change_id: scan-refresh-spec-waits-for-render
title: "The Scan status refresh spec counts only after the page shows Scan now's answer"
status: archived
roadmap_item: null
branch: claude/project-thread-iqvmvw
created: 2026-11-26
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
`e2e/header-refresh.spec.ts` "Scan status stops refreshing itself once the scan it queued is over" passes or fails
only on what the app does, never on when the spec happens to look.

## Context
It failed on master 9dd17d7 in "e2e under load" (run 45794189275, job 139820638644): expected at most 1 refresh,
received 2. Reproduced locally with Scan status and `/api/scan-progress` answers delayed by 0.8–1.5 s (11 of 12 runs
red). The request log of one run:

- `POST /scan-status` (Scan now) at 32 ms, its answer at 106 ms;
- "A scan is running" already hidden at 111 ms: React had not rendered the answer yet, so the page still showed the
  state before the press, and the spec started counting while the scan it had just queued was running;
- `GET /scan-status` (RSC) at 2138 ms: Scan status's own refresh while the scan runs (correct);
- `/api/scan-progress` answered idle at 2687 ms, `GET /scan-status` (RSC) at 2697 ms: the header's one reload when it
  sees the scan end (correct).

Both refreshes are what the app should do; the app keeps no loop running afterwards. The spec's sync was wrong.

## Constraints
- No retries, no loosened assertion: the spec now demands 0 refreshes once everything settled (it allowed 1 before).

## Notes
- Research and frame skipped: the request log above is the investigation; the cause is in the spec.
- Still red on the code before PR #130 (3 refreshes in 6 s, 2/2 runs).

## Done
- Spec fix in 34549df; full e2e 89/89 (default workers once, 4 workers twice).
