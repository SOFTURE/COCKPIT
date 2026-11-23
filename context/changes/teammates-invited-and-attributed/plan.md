# Plan: teammates-invited-and-attributed

## Goal
The owner (admin) invites teammates by email on Settings → Team and removes them there; an invited teammate signs in
and sees the same projects, inbox and overview; every answer stores and shows who gave it, in the inbox, the history
and the owner-word issue. Out of scope: mail delivery of invitations (CMP-12 / CMP-20), per-project visibility.

## Approach
**Starting point:** one account, no roles, `answered_by` stored but never shown.

**Chosen:** turn on `auth({ invitations })` with the console sender behind `src/team/invitation-sender.ts`, route
the invitation actions to `/settings/team`, and build that page from the auth parts (`InvitationPanel`) plus a
members list with Remove (`deleteAuthUserData`). Add `grant-role` so the owner holds `admin`. Snapshot the answerer's
name on each answer and pass it to the issue and the inbox.
Rejected: `ADMIN_EMAILS` (touches lane R's deploy files); joining `auth.users` at read time only (a removed
teammate's answers would lose the name).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Admin | `npm run grant-role -- --email=<owner> --role=admin --commit` once; e2e seeds admin | auth README's safer path; no deploy file change | research |
| Sender | console sender now; mailing once CMP-12 is on master | roadmap unknown; no local mail workaround | research |
| Team page | `/settings/team`, `routes.invitations` points there | one screen for members and invitations in the shell | research |
| Remove | `deleteAuthUserData`; not yourself | next request refused (FR-16) | auth README |
| Attribution | `answered_by_name` snapshot, migration `projects/0004` with backfill | history keeps the name after removal | research |
| Name in issue | display name, else the email before `@` | issues may be public; no addresses | research |
| Repositories | every member manages them | same projects for the team (PRD) | PRD |

## Phase 1: Attribution of answers
**Discipline:** TDD (business rule). **Files:** `modules/projects/migrations/0004_add_answered_by_name.sql`,
`modules/projects/schema.ts`, `modules/projects/answers.ts`, `src/decisions/answer-entry.ts`,
`src/forge/issues.ts`, `src/team/answerer-name.ts`, `src/inbox/build-inbox.ts`, `src/inbox/load-inbox.ts`,
`src/inbox/inbox-row.tsx`, `app/(app)/inbox/**`, `messages/en.ts` (`inbox.answeredBy`), `tests/**`.

**Tests:** answer-entry (stores the name; the issue names the answerer), issues (name in body, no address, note
"Note from <name>"), answerer-name (display name, email local part, blank), build-inbox (sent/done/history carry
the name; marker-only issues carry none), migration backfill (existing row gets the account's name).

**Done when:**
- Automated: the tests pass; Gates green (typecheck, lint, test).

## Phase 2: Team screen, invitations and removal
**Discipline:** TDD for `src/team/**` server code, test-after for the page. **Files:** `softure.config.ts`
(`invitations`, `routes.invitations`), `src/team/invitation-sender.ts`, `src/team/members.ts` (list, remove),
`src/team/member-list.tsx`, `app/(app)/settings/team/page.tsx`, `app/(app)/settings/team/actions.ts`,
`app/(app)/settings/page.tsx` (link for admins), `scripts/grant-role.ts`, `package.json` (script),
`README.md` (owner step), `messages/en.ts` (`team.*`), `e2e/prepare.ts`, `e2e/fixtures.ts`, `e2e/team.spec.ts`,
`tests/team/**`.

**Tests:** vitest: an invited address registers through `registerInvitedUser` and the account exists; a used,
revoked and expired token create nothing; `listMembers` lists accounts with admin marks; `removeMember` deletes the
account and its sessions and refuses yourself. e2e: the owner opens Team, invites an address and sees it pending; a
seeded teammate signs in, sees the same projects and answers an entry, and the created issue and the inbox name
them; the owner removes the teammate and the teammate's next request lands on the login page; a teammate without
admin gets "not found" on Team.

**Done when:**
- Automated: tests and the e2e pass; Gates green.
- Manual: the Team page renders on the theme in light and dark, desktop and 390 px (evidence: Playwright
  screenshots the run inspects, saved under `cockpit/evidence/teammates-invited-and-attributed/`).

## Risks and rollback
- Rollback: revert the merge; `ALTER TABLE projects.answers DROP COLUMN answered_by_name;` and delete the
  `softure.migrations` row (see the migration header). Accounts created by invitation stay; remove them on Team
  first.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Attribution of answers

#### Automated
- [ ] 1.1 Attribution tests pass: stored name, issue names the answerer without an address, inbox and history carry it, backfill
- [ ] 1.2 Gates green (typecheck, lint, test)

### Phase 2: Team screen, invitations and removal

#### Automated
- [ ] 2.1 Team tests pass: invited registration, refused tokens, members list, removal
- [ ] 2.2 `e2e/team.spec.ts` passes: invite, teammate answers and is named, removal refuses the next request, non-admin gets not found
- [ ] 2.3 Gates green (typecheck, lint, test)

#### Manual
- [ ] 2.4 Team page renders on the theme in light and dark, desktop and 390 px (evidence: Playwright screenshots the run inspects)
