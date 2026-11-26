# Plan: release-confirm-dialogs-tested

## Approach
Add one e2e test per new confirmation dialog, next to the specs that already cover the screen: `e2e/team.spec.ts`
(invitations) and `e2e/mcp.spec.ts` (tokens).

## Key decisions
- The token test proves the effect at the endpoint (a revoked token gets 401), not only on the screen.
- The disconnect of an OAuth grant is not tested: OAuth client registration is closed in this app, so no grant can be
  created in the e2e.

## Phase 1: Revoke behind a confirmation

- Files: `e2e/team.spec.ts`, `e2e/mcp.spec.ts`.
- Mode: test-after (the behaviour ships in the packages).
- Done when: both tests pass locally and in the pull request's CI, with the full e2e suite green.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Revoke behind a confirmation

#### Automated
- [ ] 1.1 Invitation: Cancel keeps it pending; confirmed Revoke shows "Revoked" (`e2e/team.spec.ts`)
- [ ] 1.2 MCP token: Cancel keeps it working; confirmed Revoke removes it and the endpoint answers 401 (`e2e/mcp.spec.ts`)
- [ ] 1.3 Gates and the full e2e green locally and in the pull request's CI
