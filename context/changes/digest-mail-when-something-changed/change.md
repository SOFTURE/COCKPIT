---
change_id: digest-mail-when-something-changed
title: "One mail with what shipped, what waits and what broke, sent only when something changed"
status: new
roadmap_item: CMP-12
branch: null
created: 2026-11-20
updated: 2026-11-20
archived_at: null
---

## Intent
The owner receives one digest mail on a schedule listing what shipped, what waits for them and what broke since the last digest; nothing is sent when nothing changed; one-click unsubscribe works.

## Context
Roadmap item CMP-12 of `context/foundation/roadmap.md` (cockpit-v1, v1), quoted:

> ### CMP-12: Digest mail when something changed
> - **Change ID:** `digest-mail-when-something-changed`
> - **Status:** blocked (funding: slice not funded yet)
> - **Outcome:** the owner receives one digest mail on a schedule listing what shipped, what waits for them and what broke since the last digest; nothing is sent when nothing changed; one-click unsubscribe works.
> - **Prerequisites:** CMP-8; the owner funds the digest slice; a mail provider key and a verified sender (owner step).
> - **Touches (estimate):** `src/digest/**`, `softure.config.ts` (mailing and a digest schedule), `db/migrations/` (one: digest log), `messages/en.ts` (own keys).
> - **Size (owner-requested):** M
> - **Slice:** Digest
> - **Unknowns:**
>   - Is this slice funded? (owner: owner, decision after the first usable slice; blocks: yes)
>   - Digest time and recipients (owner: owner; blocks: no)
> - **Risk:** needs an owner secret before it can be verified for real.
> - **Baseline:** no mail; after: a test with two scans and no change sends nothing; with a change sends one mail.
> - **PRD refs:** FR-12, G-5
> - **Input:** context/changes/digest-mail-when-something-changed/change.md

Findings gathered while recording the roadmap (2026-11-20):
- `@softure-ai/mailing` 0.2.8: `sendMail` over a provider adapter (Resend first), idempotency keys, signed one-click unsubscribe (RFC 8058).

## Constraints
- Owns (estimate, from the roadmap's lanes): `src/digest/**`, `softure.config.ts` (mailing and a digest schedule), `db/migrations/` (one: digest log), `messages/en.ts` (own keys).
- Read-only toward watched repositories; the one write COCKPIT makes is creating owner-word issues (AGENTS.md).
- No release, tag, npm publish or deploy without the owner's word (AGENTS.md; `release.owner: true`).
- Generic and fictional: no real person, company, client or project in code, fixtures or screenshots.
- Do not start before the owner's go (owner, 2026-11-20), and not before its slice is funded.

## Notes
