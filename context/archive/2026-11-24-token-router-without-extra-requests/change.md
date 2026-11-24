---
change_id: token-router-without-extra-requests
title: "A scan with several forge tokens asks the forge no more than with one"
status: archived
roadmap_item: null
branch: claude/project-thread-uk52md
created: 2026-11-24
updated: 2026-11-24
archived_at: 2026-11-24
---

## Intent
The token router (CT-6) reads a repository of a known owner with no extra request, so a scan with several tokens
costs what it cost with one.

## Context
CT-6's router picked each repository's token with a `getRepository` call first, so every scan asked one metadata read
more per repository. Under the e2e's parallel load that lengthened the full scan (master run 45404304993); the
header-refresh spec itself was fixed separately by giving it its own server and database (#76).

## Constraints
- No release, tag, publish or deploy.

## Notes
- Research skipped: the router is one file and its request counts are measured by the fake forge in its tests.
- Frame skipped: removing the extra request is the whole outcome.

## Done
- A call goes to the token that last read the repository, else the token that last read one of its owner's
  repositories (per-process hints), else the tokens in order; only `not_found`/`unauthorized` (and `refused` for a
  write) move on. Router tests 12/12; the two request-count tests fail on the old router.
