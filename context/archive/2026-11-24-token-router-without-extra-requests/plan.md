# Plan: token-router-without-extra-requests

## Approach
`src/forge/token-router.ts` sends each call to the token that last read the repository, else the token that last read
one of its owner's repositories (`OwnerHints`, shared per process by `src/projects/forge-access.ts`), else the tokens
in order; only an answer that says the token cannot see the repository (`not_found`, `unauthorized`; for a write also
`refused`) moves on. `hasLabel` first finds the repository's token, so a 404 from a token that cannot see it is never
read as "no label".

## Key decisions
- Owner hints live in the process, not the database: a restart costs at most one extra request per owner.

## Phase 1: Router

- Files: `src/forge/token-router.ts`, `src/projects/forge-access.ts`, `tests/forge/token-router.test.ts`, `CHANGELOG.md`.
- Mode: TDD (the request-count tests fail on the old router).
- Done when: router tests green; gates green; the pull request's CI green; master's `ci` green on the merge SHA.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Router

#### Automated
- [x] 1.1 Router request-count tests red on the old router (2 failed, 10 passed), green on the new one (12/12) — db2de03
- [x] 1.2 Gates green: typecheck, lint (language scan), test 603/603 — db2de03
- [x] 1.3 Pull request CI green before the merge; master `ci` checked on the merge SHA by the thread after the merge — db2de03
