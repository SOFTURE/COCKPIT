---
change_id: teammates-invited-and-attributed
title: "The owner invites teammates who see and answer the same projects; each answer shows who gave it"
status: new
roadmap_item: CMP-19
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
The owner invites teammates by email; they see and answer the same projects; every answer and every owner-word issue shows who gave it.

## Context
Roadmap item CMP-19 of `context/foundation/roadmap.md` (cockpit-v1, v2), quoted:

> ### CMP-19: Teammates invited and attributed
> - **Change ID:** `teammates-invited-and-attributed`
> - **Status:** ready
> - **Outcome:** the owner invites teammates by email; they see and answer the same projects; every answer and every owner-word issue shows who gave it.
> - **Prerequisites:** CMP-8; `@softure-ai/auth` 0.2.20 or newer (invitations, SOFTURE/AI#1406, released 2026-11-20).
> - **Touches (estimate):** `src/team/**`, `app/(app)/settings/team/**`, `app/admin/invitations/page.tsx` (the auth package's invitations page), `db/migrations/` (one: attribution if not already present), `messages/en.ts` (own keys).
> - **Size (owner-requested):** L
> - **Slice:** Teams
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
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
