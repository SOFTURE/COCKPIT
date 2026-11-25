# Research: token-router-moves-past-refused-token

## How it works today
- `src/forge/token-router.ts` (#77): a call goes to the token that last read the repository, else the owner hint
  (`OwnerHints`, one map per process in `src/projects/forge-access.ts`), else the tokens in order. `READ_MOVE_ON` is
  `not_found`, `unauthorized`; `WRITE_MOVE_ON` adds `refused`. A failure outside the set is returned at once.
- `src/forge/client.ts` maps a 403 to `refused` (with `x-accepted-github-permissions` when the forge sends it), except
  a 403 with no budget left, which is `rate_limited`.
- `src/broadcast/send-broadcast.ts` checks `hasLabel` before `createIssue`; a failed label check is recorded as the
  send's failure, and `not_found`/`refused` both read "forge_refused", whose message is "the access token needs
  Issues read and write". The send row keeps only the failure code (`projects.broadcast_sends.failure`).
- `src/scan/scan-projects.ts` treats `refused`/`unauthorized`/`not_found` on `context/state.json` as `not_readable`,
  which the overview shows as `state_unreadable`.

## Evidence
- COCKPIT over MCP, 2026-11-25 08:01 UTC: `SOFTURE/COCKPIT` read status `not_readable`, broken reason
  `state_unreadable`, though the repository is public.
- The router before #77 (`b44b070:src/forge/token-router.ts`) picked a token with `getRepository` and moved on after
  any failure, so a 403 from the first token was never final.
- Retry (`retryBroadcastSend`) runs the same `sendToProject`, so it hits the same refused label check; the page shows
  the same failure text with no sign that it ran again.

## Risks
- `refused` also covers 4xx like 422 on a write; for reads only a 403 is a permission answer, so moving on for any
  `refused` read is safe (no read has side effects).
- A new column on `projects.broadcast_sends` needs a forward-only migration with a rollback note.

## SOFTURE modules
- Nothing in `@softure-ai/*` covers routing between forge tokens; this stays local (the router is COCKPIT's own).
