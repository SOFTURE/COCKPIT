---
change_id: teammates-invited-and-attributed
title: "The owner invites teammates who see and answer the same projects; each answer shows who gave it"
status: archived
roadmap_item: CMP-19
branch: claude/project-thread-wvrwyw
created: 2026-11-20
updated: 2026-11-23
archived_at: 2026-11-23
---

## Intent
The owner invites teammates by email; they see and answer the same projects; every answer and every cockpit issue shows who gave it.

## Context
Roadmap item CMP-19 of `context/foundation/roadmap.md` (cockpit-v1, v3), quoted:

> ### CMP-19: Teammates invited and attributed
> - **Change ID:** `teammates-invited-and-attributed`
> - **Status:** ready
> - **Outcome:** the owner invites teammates by email; they see and answer the same projects; every answer and every cockpit issue shows who gave it.
> - **Prerequisites:** CMP-8; `@softure-ai/auth` 0.2.20 or newer (invitations, SOFTURE/AI#1406, released 2026-11-20).
> - **Touches (estimate):** `src/team/**`, `app/(app)/settings/team/**`, `app/admin/invitations/page.tsx` (the auth package's invitations page), `db/migrations/` (one: attribution if not already present), `messages/en.ts` (own keys).
> - **Size:** L
> - **Unknowns:**
>   - Which sender does an invitation use before the digest's mail provider exists: `mailingInvitationSender()` with the same provider, or the console sender until CMP-12? (owner: research; blocks: no)
> - **Risk:** the first item with a second person; invitations come from `@softure-ai/auth` 0.2.20 (no local workaround), and the answer history keeps who answered from CMP-5 on, so no meaning changes.
> - **Baseline:** one owner; after: an invited fictional teammate answers an entry and the issue names them.
> - **PRD refs:** FR-16, G-2
> - **Input:** context/changes/teammates-invited-and-attributed/change.md

Findings gathered while recording the roadmap (2026-11-20):
- Gap filed: SOFTURE/AI#1406 (`@softure-ai/auth`: invite a person by email while registration is closed). Auth today has global roles and ops scripts only.
- Re-checked 2026-11-20 (roadmap v2): SOFTURE/AI#1406 is closed and released in `@softure-ai/auth` 0.2.20: `auth({ invitations: { send } })`, an admin-only `InvitationsPage` (`app/admin/invitations/page.tsx`), single-use links valid 72 h by default (only their sha256 stored), acceptance while `auth.registration_closed` is on with the invited roles granted at registration, resend and revoke, an `invitation` rate-limit bucket, `mailingInvitationSender()` and `consoleInvitationSender`.

## Constraints
- Owns (estimate, from the roadmap's lanes): `src/team/**`, `app/(app)/settings/team/**`, `db/migrations/` (one: attribution if not already present), `messages/en.ts` (own keys).
- Read-only toward watched repositories; the one write COCKPIT makes is creating cockpit issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
- Started 2026-11-23 on the owner's go (BUILD GO), one thread for this item.
- Frame skipped: the outcome and the package seam are fixed by the roadmap and SOFTURE/AI#1406.

## Decisions (auto)
- Sender: console sender until the mailing module of CMP-12 is on master; then `mailingInvitationSender()` (here if
  CMP-12 lands first, else in CMP-20).
- The owner holds `admin` through `npm run grant-role` (owner step after `create-account`).
- The issue names the answerer by display name, else the part of the email before `@`; the app shows the full name
  or email.
- Watched repositories stay manageable by every member.

## Done
- Settings → Team (admin only): members with Remove, and auth's invitation panel (invite, resend, revoke); a removed
  teammate's next request lands on the login page.
- Every answer stores who gave it (`projects.answered_by_name`, migration `projects/0004` with backfill); the inbox,
  the history, the project page and the cockpit issue name them (the issue by display name or the part of the
  email before `@`).
- `npm run grant-role` (and `softure-deploy run ... grant-role`) makes the owner admin.
- Sender: CMP-12 merged first, so production sends invitations with `mailingInvitationSender()` through its
  mailing module (Resend, `MAIL_FROM`); development prints the link. Handoff (CMP-20): verify one invitation mail end
  to end once the owner's provider key and sender exist.
- Owner step (before the first release with teams): after `create-account`, run
  `softure-deploy run --host=<ssh alias> grant-role --email=<owner> --role=admin --commit`.
