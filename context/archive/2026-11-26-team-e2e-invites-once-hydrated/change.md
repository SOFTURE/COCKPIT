---
change_id: team-e2e-invites-once-hydrated
title: "The team e2e sends the invitation only once the Invite tab is interactive"
status: archived
roadmap_item: null
branch: claude/project-thread-ryg68e
created: 2026-11-26
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
`e2e/team.spec.ts:31` passes every run. It failed in `e2e under load` on pull request #128 (run 45778106613, attempt
2) while master 101210c was green on the same source: "The invitation was saved but the mail was not sent. Try
Resend." never appeared.

## Context
The page snapshot at the failure shows the Invite tab with an empty Email field, the button not pending, no error and
"No invitations yet.", and the run's server log has no invitation attempt in that step (the passing first step logs
`invitation send failed ... mailing.unavailable`): the server never received the invite. Invite is a full page load
(the theme's `TabBar` tabs are plain `<a>` links), and the spec typed and pressed Send right after the new document
committed. Locally the press lands about 100 ms after the load event, before React hydrates, and goes out as the
form's native progressive-enhancement POST; that path works. In CI under load the press fell into the moments around
hydration and was lost.

What was ruled out, each by a local experiment: hydration resetting the typed address (it keeps it, with scripts held
back 0.5 to 3 s); a press before hydration (the native POST saves the invitation); a press racing the header's
automatic refresh after a scan, in either order; six full suites with `--workers=4` with the spec probed for reloads
and console errors (all green, no reload). One mechanism did wipe the field: when the automatic `router.refresh()`
after a scan fails, Next falls back to a full reload of the page. No CI evidence shows a failed refresh, and the
artifact with the trace could not be downloaded from the session. The auth 0.2.24 bump did not change the invite form.

The fix removes the window rather than one guessed trigger: the address is typed only once React has hydrated the
form and the button, and its value is checked right before Send. `e2e/wait-for-hydration.ts` already exists for the
same class of failure (`routines-e2e-waits-for-hydration`, 2026-11-25). PR #129 added a second invite (revoke test)
with the same pattern; it uses the helper too.

## Constraints
- Spec only; no product change, no retries, no loosened assertion, no release.
- Do not touch `e2e/overview.spec.ts` (another thread fixes it).

## Notes
- Research skipped: the failing run's log and page snapshot are the investigation; recorded above.
- Frame skipped: a failing e2e is a bug to fix at once (AGENTS.md → CI).
- Product side (text typed before hydration is lost) is the known gap #55; a full reload per tab is the theme's
  `TabBar` design; neither is widened here.

## Done
- The spec waits for the Email field to be hydrated before it types, and checks its value before Send invitation.
- Both invite tests send through one helper, `sendInvitation`, that waits for hydration and checks the typed value.
- A new test holds every script back a second, so the Invite tab hydrates long after it is on screen (the CI timing),
  and proves the invitation is still sent and stays pending.
