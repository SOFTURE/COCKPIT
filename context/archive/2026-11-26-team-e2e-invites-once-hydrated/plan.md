# Plan: team-e2e-invites-once-hydrated

## Approach
One helper in `e2e/team.spec.ts`, `sendInvitation`, waits until React has hydrated the Email field and the Send
button (`waitForHydration`), types the address and checks it is still there before it presses Send invitation. Every
invite in the spec uses it. A new test holds every `/_next/static/` script back for a second, so the form is
server-rendered long before it hydrates, and proves the invitation still goes out.

## Phases
### Phase 1: invite only once hydrated (test-after)
- `e2e/team.spec.ts`: `sendInvitation(page, email)` used by the invite and the revoke tests; new test "an invitation
  is sent when the Invite tab's scripts arrive late" with a distinct address (`slow-page@example.com`).
- Done when: the team spec and the full suite with `--workers=4` pass locally, and CI is green on the pull request
  and on master.

## Progress
- [x] Phase 1: helper and late-scripts test; `npx playwright test e2e/team.spec.ts`: 6 passed; `npx playwright test
  --workers=4`: 84 passed (1.7m), local; typecheck and lint clean.
