---
change_id: token-router-moves-past-refused-token
title: "Reads and writes for an organisation's repositories reach the token that has access again"
status: archived
roadmap_item: null
branch: claude/project-thread-63jsku
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
issue: 85
---

## Intent
Every watched repository is read, and its cockpit issues are created, with a token that has access, whichever
configured token the router asks first; a token's refusal moves the call on to the next token, and the error the
owner sees names the token that was refused (#85).

## Context
Since #77 (shipped in v2026.11.24-5) a read moves on to the next token only on `not_found`/`unauthorized`. An
organisation that turns away another owner's fine-grained token answers 403 (`refused`) even for its public
repositories, so every read of those repositories stopped at the first token: the scan marks them unreadable and a
broadcast fails at its label check with "the access token needs Issues read and write", before any write is tried.
Before #77 the router picked the token with a metadata read that moved on after any failure. Retry runs the same
path and fails the same way, so the page looks unchanged.

## Constraints
- No release, tag, publish or deploy: the coordinator releases once at the end.
- Read-only toward watched repositories; the only write stays the cockpit issue.
- The usual call still costs no extra request (the outcome of #77).

## Notes
- Frame skipped: the issue names the outcome and the cause is confirmed in the code (see research.md).
- After the coordinator's release (production, so not verifiable from the branch): a broadcast to one personal and
  one organisation repository creates both issues, Retry on the earlier failed send succeeds, and the organisation's
  projects read without errors; the session that runs the release checks it over COCKPIT's MCP.
- Archived 2026-11-25: a token's 403 moves reads and writes on to the next token again, and a failed broadcast send
  names the refused token and its last try.

## Done
- Reads and writes move on after `refused`/`not_found`/`unauthorized` and drop the hint that led there; failures
  name the token by label; a failed broadcast send stores and shows it with the last try (migration `projects` 0006).
  PR #86.
