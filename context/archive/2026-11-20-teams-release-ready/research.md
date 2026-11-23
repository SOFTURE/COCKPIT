# Research: teams-release-ready

Read on master 46fe101 (CMP-1 to CMP-10, CMP-12 to CMP-14, CMP-19, CMP-21, CMP-22 merged), with `@softure-ai/auth`
and `@softure-ai/mailing` as installed.

## How things are today
- CMP-19 turned on invitations: `softure.config.ts` passes `mailingInvitationSender()` to `auth({ invitations })` when
  `NODE_ENV` is `production` and the console sender otherwise. The choice sits inline in the config and no test proves
  that production mails the link: the team tests use the console sender (`tests/team/members.test.ts`).
- The mail goes out through the mailing module of CMP-12 (Resend, `MAIL_FROM`, `RESEND_API_KEY`). CMP-13 already
  passes `MAIL_FROM` and `RESEND_API_KEY` to the app as optional names (`docker/prod/docker-compose.yml`), so the app
  process that sends the invitation has them in production. No new environment name is needed.
- `npm run grant-role` (`scripts/ops/grant-role.ts`) makes the owner admin; the Dockerfile bundles every
  `scripts/ops/*.ts` into `ops/*.mjs`. The deploy dry run (`scripts/deploy-dry-run.sh`) checks only `create-account`.
- `package.json` is `0.2.0`; `CHANGELOG.md` has `0.2.0 (unreleased)` (digest) and `0.1.0 (unreleased)`. Open pull
  requests of other slices also bump the version (0.3.0 CMP-16, 0.4.0 CMP-11, 0.5.0 CMP-23): the version is taken as
  the next one after master at merge time.
- The roadmap's `## Before the next release` has no teams line yet; CMP-19's handoff asks to verify one invitation
  mail end to end once the owner's provider key and sender exist, and names the owner step `grant-role`.

## What the packages give
- `mailingInvitationSender()` reads the registered config (`getSoftureConfig`) at send time, renders the mail from
  auth's dictionaries and sends it with `sendMail`; a failed send throws, `inviteUser` answers
  `auth.invitation_not_sent` and the invitation stays pending (auth `invitations.d.ts`, `mailing/invitation-mail.js`).
- `@softure-ai/mailing/testing` has `fakeMailProvider()`, which records the sent mails; the digest tests use it.

## Framing
`frame` skipped: the outcome is the packaging step the roadmap fixes (version, notes, dry run); no competing framing.

## Risks
- The end-to-end send needs the owner's Resend key and verified sender: an owner step, not something the run can do.
  The run proves the production path with a fake provider instead.
- Version and changelog conflict with the other release items: resolved when merging master in.
