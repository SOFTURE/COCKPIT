# Plan: teams-release-ready

## Goal
The teams slice is ready to release: production mails invitations (proved with a fake provider), the release ships
the `grant-role` ops script (the dry run checks it), and the version and release notes list CMP-19. Nothing is
tagged, released or deployed (owner's word).

## Approach
**Chosen:** move the sender choice into `src/team/invitation-sender.ts` (`getInvitationSender(nodeEnv)`), test that
production's sender delivers one invitation mail with the link on `APP_ORIGIN` through the mailing module, and that a
provider failure leaves the invitation pending; add a `grant-role` check to the deploy dry run; next minor version
with its changelog section.
Rejected: a new required setting for invitations (the app already gets `MAIL_FROM` and `RESEND_API_KEY`).

**Key decisions:**
| Decision | Choice | Why | Source |
| --- | --- | --- | --- |
| Proof of the production send | vitest with `fakeMailProvider()` and the registered config | the real send needs the owner's key | research |
| Dry run | `node ops/grant-role.mjs` exists in the app image | the owner step runs it on the server | README, Deploy |
| Version | next minor after master at merge time (`0.3.0` on 46fe101) | one version per slice | roadmap, coordinator |
| Env names | none added | CMP-13 passes the mail settings to the app | research |

## Phase 1: Invitation mail proved, dry run, version and notes
**Discipline:** TDD (the invitation mail test first). **Files:** `src/team/invitation-sender.ts`, `softure.config.ts`,
`tests/team/invitation-mail.test.ts`, `scripts/deploy-dry-run.sh`, `docker/prod/docker-compose.yml` (comment),
`package.json`, `package-lock.json` (version), `CHANGELOG.md`, `README.md`, `context/foundation/roadmap.md`
(owner step).

**Tests:** `tests/team/invitation-mail.test.ts`: production's sender is the mailing one and development's the console
one; inviting an address sends one mail to it whose text carries the invitation link on `APP_ORIGIN`, which accepts
registration; a provider failure answers `auth.invitation_not_sent` and the invitation stays pending.

**Done when:**
- Automated: the invitation mail test passes, and fails when production uses the console sender (mutation checked).
- Automated: Gates green (typecheck, lint, test).
- Automated: `deploy-dry-run` green on the pull request, with the `grant-role` check.
- Automated: `context-doctor` green.

## Risks and rollback
- The real send needs the owner's provider key and sender: listed under `## Before the next release`.
- Rollback: revert the merge; nothing runs outside CI.

## Decisions (auto)
- No new environment names; invitation mail rides the CMP-13 settings.
- The version follows master at merge time; conflicts with other release items are resolved when merging master in.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Invitation mail proved, dry run, version and notes

#### Automated
- [x] 1.1 Invitation mail test passes; production on the console sender turns it red — 7518137
- [x] 1.2 Gates green (typecheck, lint, test: 45 files, 294 tests) — 7518137
- [x] 1.3 Deploy dry run green with the `grant-role` check (PR #31, run 45156894180) — e95f6f6
- [x] 1.4 `context-doctor` green (PR #31, run 45156894180) — e95f6f6
