# Research: teammates-invited-and-attributed

## Question
How CMP-19 lets the owner invite teammates by email, gives them the same projects, inbox and overview, lets the
owner remove them, and names who answered in the answer history and in the owner-word issue (FR-16, G-2).

## Today (master 18683e6)
- `softure.config.ts`: `auth({ registrationClosed: true, routes, password })`; no roles, no invitations. The only
  account comes from `npm run create-account` (`maxAccounts: 1`). Every screen and action calls `requireUser()`, so
  any account sees every watched project; there is no per-user data besides answers.
- `projects.answers.answered_by` (text, no foreign key) holds the answering user's id since CMP-5. Nothing shows it.
- `src/forge/issues.ts` writes "The owner answers **Yes** ..." and "Note from the owner"; its header says it names
  no person.
- `src/inbox/build-inbox.ts`: `AnswerState` sent/done and `HistoryRow` carry no person. `InboxRow` shows "Sent"
  with the issue link; the inbox page lists the history.
- e2e: `e2e/prepare.ts` creates the owner with `createTestAccount`; the fake forge keeps created issues and serves
  them on `GET /__issues/<owner>/<name>`.

## `@softure-ai/auth` 0.2.21 (installed; invitations since 0.2.20, SOFTURE/AI#1406)
- `auth({ invitations: { send } })` turns invitations on; `send` is an `InvitationSender`
  `(link, { email }, { expiresAt, locale, roles })`. `consoleInvitationSender` prints the link and refuses in
  production; `mailingInvitationSender()` (`@softure-ai/auth/mailing`) needs the `mailing` module, which COCKPIT
  does not have yet (CMP-12 adds it, in a parallel thread).
- Server functions (`/server`): `inviteUser`, `resendInvitation`, `revokeInvitation`, `listInvitations`,
  `findInvitation`, `registerInvitedUser`; context `{ db, clock, config }`. The register page accepts
  `?invitation=<token>` while registration is closed; a used, expired, revoked or replaced token gets
  `auth.invitation_invalid` and creates nothing.
- UI parts: `InvitationPanel` (`/ui`), `toInvitationRow`, `inviteAction`, `resendInvitationAction`,
  `revokeInvitationAction` (`/next`). The actions are admin-only and redirect to `routes.invitations`
  (default `/admin/invitations`, overridable through `auth({ routes })`).
- Roles: `admin` is always declared; `requireRole`, `hasRole`, `grantRole`; ops script `createGrantRoleScript`
  (`@softure-ai/auth/scripts`). Nothing is granted by default, so today the owner is not admin.
- Removing: `deleteAuthUserData(context, userId)` deletes the account with its sessions, roles and invitations to
  its address; the next request of that person finds no session (`requireUser` sends them to the login page).
  Listing accounts: the Drizzle table `users` (id, email, created_at, display_name) and `userRoles` are exported for
  app reads.
- `AuthUser.displayName` is null for password accounts (only OpenID Connect sets it); show
  `displayName ?? email`.

## Options and findings
- **Who may invite:** the invitation actions need `admin`. The owner gets it with a new `npm run grant-role` ops
  script (the README's safer path), run once after `create-account`; the e2e seeds the owner with `roles: ["admin"]`.
  `ADMIN_EMAILS` would need the compose file and the deploy workflow, which lane R owns.
- **Sender (roadmap unknown):** the console sender now; `mailingInvitationSender()` once the mailing module of CMP-12
  is on master (switch it in this change if CMP-12 lands first, else in CMP-20, the teams release gate).
- **Attribution:** keep `answered_by` (id) and add a snapshot `answered_by_name` (migration
  `projects/0004`), backfilled from `auth.users` for existing rows, so a removed teammate's answers still name them.
  The in-app history shows the stored name; the issue, which may sit in a public repository, names the display name
  or the part of the email before `@`, never a full address.
- **Answers through other paths:** CMP-14 (MCP, parallel thread) will call `answerEntry`; the new required
  `answeredByName` input is a compile-time signal for it at merge.
- **Watched repositories:** stay manageable by every member (the PRD gives teammates the same projects; only
  inviting and removing people is the owner's).

## Risks
- A teammate with `admin` (the panel offers the role) can remove others; acceptable for a team of about five.
- Invitations cannot be delivered in production until the mailing module exists; tracked for CMP-20.
