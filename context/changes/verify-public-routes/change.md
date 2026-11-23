---
change_id: verify-public-routes
title: "The release verifies only routes that answer without a session"
status: open
roadmap_item: null
branch: claude/project-thread-s8aif1
created: 2026-11-23
updated: 2026-11-23
---

## Intent
`deploy.json` verifies only routes the app serves without a session, so the release's verify step passes on a live,
healthy release: `/api/health` and a rendered public page (`/unsubscribe`) instead of `/`.

## Context
The first release deployed and switched cleanly (server steps all `ok`, `/api/health/build` answered the new tag),
but verify failed on `/`: `status 302, expected 200; missing strict-transport-security`. `/` is guarded twice: the
app's session guard (`proxy.ts`, `protect: ["/"]`, everything outside `PUBLIC_PATHS`) and, behind a CDN, the edge's
sign-in, which answers the redirect itself without the app's headers. No production setup can make `/` answer 200
to an anonymous probe, so the route is wrong, not the server.

## Constraints
- No change to the session guard, `PUBLIC_PATHS` or the edge.
- The verify still proves a page renders (no `Application error`) and the headers (`strict-transport-security`,
  no `x-powered-by`).
- No release, tag, publish or deploy in this change; the redeploy of the existing tag follows the owner's earlier
  release word.

## Notes
- Research skipped: the failure is in the release log (route, status, headers), the guard's config is one line in
  `proxy.ts`, and a probe from the server shows `/unsubscribe` answers 200 with HSTS and the `COCKPIT` title.
- Frame skipped: a deploy blocker found by the release itself.
