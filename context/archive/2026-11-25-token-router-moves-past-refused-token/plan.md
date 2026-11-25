# Plan: token-router-moves-past-refused-token

## Approach
- Router: a read also moves on after `refused` (a 403 from a token the owner turned away), so reads and writes move
  on after the same answers. A move-on answer from the token a pick or an owner hint pointed at drops that pick and
  hint, so the next call starts with the token order again and remembers the token that answered.
- When every token fails, the router answers the first `refused` failure if there is one (the token that sees the
  repository but lacks a permission), else the first failure; a `refused` or `unauthorized` failure carries the label
  of the token that gave it (`FORGE_TOKEN`, `FORGE_EXTRA_TOKENS[1]`, …), set by `forge-access.ts`.
- Broadcast: a failed send stores that token label (new nullable column `failure_token`, migration 0006), and the
  page names it and the time of the last try, so a Retry that fails again visibly ran and says why.

## Key decisions (auto)
- Labels are the environment names and positions, never token text (NFR-6: a token is never shown or logged).
- The label rides on `refused`/`unauthorized` only: those are the failures a token's permissions explain.
- `hasLabel` routes through the same move-on logic after the repository's token is found, so a refused label check
  moves on too.

## Phase 1: Router moves past a refused token

- Files: `src/forge/client.ts`, `src/forge/token-router.ts`, `src/projects/forge-access.ts`,
  `tests/forge/token-router.test.ts`.
- Mode: TDD: a test with two tokens and the owner hint on the token the organisation refuses (403) fails on the
  current router and passes after the fix; plus tests that the hint is dropped and that the failure names the token.
- Done when: router tests green; gates green.

## Phase 2: Broadcast names the refused token and the last try

- Files: `modules/projects/migrations/0006_add_broadcast_send_failure_token.sql`, `modules/projects/schema.ts`,
  `modules/projects/broadcasts.ts`, `src/broadcast/send-broadcast.ts`, `src/broadcast/build-broadcast-view.ts`,
  `app/(app)/broadcast/[id]/page.tsx`, `messages/en.ts`, `messages/pl.ts`, tests for the send and the view,
  `CHANGELOG.md`.
- Mode: test-after.
- Done when: a send refused by a token stores and shows its label; a retry that succeeds through the next token marks
  the send sent; gates and e2e green; the pull request's CI green; master's `ci` green on the merge SHA.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Router moves past a refused token

#### Automated
- [x] 1.1 Reproduction test red on the current router (3 of 15 failed), green after the fix (15/15) — c653eda
- [x] 1.2 Router tests green; gates green (typecheck, lint with the language scan) — c653eda

### Phase 2: Broadcast names the refused token and the last try

#### Automated
- [x] 2.1 Send and view tests green: refused token label stored and shown, retry through the next token sends (23/23) — fcfe721
- [x] 2.2 Gates green (unit 617/617); e2e in the pull request's CI — fcfe721
- [x] 2.3 Pull request CI green before the merge (PR #86); master `ci` checked on the merge SHA by the thread after the merge — fcfe721

