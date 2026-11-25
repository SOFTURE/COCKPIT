---
change_id: token-router-moves-past-refused-token
title: "Reads and writes for an organisation's repositories reach the token that has access again"
status: planned
roadmap_item: null
branch: claude/project-thread-63jsku
created: 2026-11-25
updated: 2026-11-25
issue: 85
---

## Intent
Every watched repository is read, and its owner-word issues are created, with a token that has access, whichever
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
- Read-only toward watched repositories; the only write stays the owner-word issue.
- The usual call still costs no extra request (the outcome of #77).

## Notes
- Frame skipped: the issue names the outcome and the cause is confirmed in the code (see research.md).
