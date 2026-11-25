# Research: project-history-as-tabs

## Where it lives
- History page: `app/(app)/projects/[owner]/[name]/history/page.tsx` stacks `DoctorSection`, `RunsSection` (CI and
  quality review side by side in `md:grid-cols-2`), `MergesSection`, `ReleasesSection` from
  `src/project-page/history/history-sections.tsx`. Data: `loadHistory` → `ProjectHistory` (`build-history.ts`), four
  independent `HistoryBlock`s, each `ok` or `failed`.
- Tab users today: the project page (`app/(app)/projects/[owner]/[name]/page.tsx` + `src/project-page/project-tabs.ts`)
  and the inbox (`app/(app)/inbox/page.tsx` + `src/inbox/inbox-tabs.ts`). Both repeat the same wiring: `TabBar`
  `size="touch"`, `tabClassName="md:h-control-height md:min-w-0"` (a local `TAB_SIZE` constant in each file), lucide
  icons with `aria-hidden`, and a `data-tab-panel` wrapper (project page only).
- Other multi-section screens: Broadcast (`app/(app)/broadcast/page.tsx`: compose card + sent list card) and
  Settings → Team (`app/(app)/settings/team/page.tsx`: members card + auth's `InvitationPanel`).
- `@softure-ai/theme-notion` `TabBar` (link tabs, `data-tab`, `aria-current="page"`, optional icon and count).

## Evidence
- Auth's invite, resend and revoke actions redirect to `routes.invitations` (`TEAM_PATH`) with `?notice=<sent|resent|revoked>`
  (`@softure-ai/auth/src/next/actions.ts` `redirectToInvitations`): the Team page must show the Invite tab when that
  parameter is present, or the confirmation lands on a hidden tab.
- Broadcast's send action redirects to `/broadcast/<id>`; delete revalidates `/broadcast` and stays on the address, so
  `/broadcast?tab=sent` keeps the Sent tab after a delete.
- e2e that read the stacked sections: `e2e/project-history.spec.ts` (regions "Recent merges", "Releases",
  "Doctor findings", "CI and quality review"), `e2e/ci-from-pull-request.spec.ts` (CI list on `/history`),
  `e2e/broadcast.spec.ts` (sent list on `/broadcast`), `e2e/team.spec.ts` (invite form and pending row on
  `/settings/team`), `e2e/polish.spec.ts` (Polish copy on `/history`, `/broadcast`, `/settings/team`).
- No message dictionary entry exists for tab labels on history, Broadcast or Team.

## Reuse
- `TabBar` from the theme; no new package. The shared piece is local (`src/shell/page-tabs.tsx`), as the request names.
- Row state: the theme's `Status` (icon + word), already used for run results.
