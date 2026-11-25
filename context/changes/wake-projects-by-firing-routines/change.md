---
change_id: wake-projects-by-firing-routines
title: "Projects wake by COCKPIT firing their routines"
status: plan_reviewed
roadmap_item: CT-10
branch: claude/project-thread-2kdm7o
created: 2026-11-25
updated: 2026-11-25
---

## Intent
COCKPIT wakes a project's coordinator by firing the project's Claude Code routine over the routines API right after
it opens a cockpit issue. One path only: COCKPIT opens the issue, COCKPIT fires the routine, the coordinator acts in
its own chat. The old wake concept (reading a project's wake declaration) and every `owner-word` name go away.

## Context
The owner's spec of 2026-11-25 (thread "Wake projects by firing their routines"), MVP stage: no backward
compatibility, no transition, no fallback. PR #89 added the `cockpit` label with an `owner-word` fallback and read both
markers and both wake keys; this change removes all of that. It absorbs #90 (switch fully to `cockpit`), closed by its
pull request.

Remove:
- the wake adapter `src/adapters/wake/*` and every use of it; COCKPIT no longer reads `autonomy.cockpitWake` or any
  wake declaration from projects;
- everything named owner-word: the label, `src/inbox/owner-word-marker.ts`, the `<!-- owner-word: ... -->` marker,
  labels and texts in forge, inbox, broadcast, decisions, MCP and scan code. The only label is `cockpit`, the only
  marker `<!-- cockpit: {"entry": "<id>", "answer": "yes|no|later"} -->`;
- any reading of `<!-- cockpit-wake: claimed -->`;
- tests, fixtures and README text for the removed parts.

Build:
1. Per project, a list of routines (many per project) in the project's settings: name, kind (`cockpit-issues` now;
   the field stays open for more kinds), trigger id or fire URL (the id is parsed), token (secret: stored encrypted,
   never shown after save except its last 4 characters, never logged, never sent to the browser; replace and
   delete), enabled.
2. After COCKPIT creates an issue in a project (broadcast or inbox answer), it fires every enabled `cockpit-issues`
   routine of that project: `POST https://api.anthropic.com/v1/claude_code/routines/<trigger_id>/fire` with
   `Authorization: Bearer <token>`, `anthropic-version: 2023-06-01`,
   `anthropic-beta: experimental-cc-routine-2026-04-01`, `Content-Type: application/json`, body
   `{"text": "COCKPIT command: <owner>/<repo>#<N> \"<title>\" (<issue url>). Act on it as AGENTS.md says for cockpit issues. Never release or deploy unless the issue gives that word."}`.
3. Each fire is recorded per issue (sent / failed with status and short reason / no routine) and shown on the
   broadcast view and the inbox answer, with Retry for that one issue. Limits: 30 fires per hour per routine, 100 per
   account; queue instead of hammering; a 429 shows as such.
4. A "Test" button per routine fires `COCKPIT test: reply in this chat that the test arrived; change nothing.` and
   shows the HTTP result.
5. The overview's "wakes on its own" comes only from COCKPIT's own data: at least one enabled `cockpit-issues`
   routine whose last fire succeeded.

## Constraints
- The issue is created first; a failed fire never deletes it.
- No token in the repository, logs, errors, MCP or CLI output.
- Outbound to api.anthropic.com must be allowed in production; an owner step is recorded if the deploy needs it.
- Tests on fakes only (a fake routines API); nothing calls api.anthropic.com.
- No release, tag, publish or deploy (the owner's word); skills are not touched.

## Done when
Unit tests (encryption and redaction, request shape, retry and 429, many routines per project), e2e (configure a
routine against the fake, broadcast to two projects, one fire each, Retry recovers a failure), the grep
`git grep -i "owner-word\|ownerword\|cockpitWake\|cockpit-wake"` is empty (see Decisions (auto) for the history it
cannot rewrite), README "Waking a project" describes the setup.

## Notes
- Frame skipped: the owner wrote the full spec, including what to remove; the problem is not in doubt.
