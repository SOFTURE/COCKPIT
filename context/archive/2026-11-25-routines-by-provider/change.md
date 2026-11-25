---
change_id: routines-by-provider
title: "Routines by provider: a generic form, Claude Code the first provider"
status: archived
roadmap_item: CT-20
branch: claude/project-thread-gr5z6k
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
A routine belongs to a provider. The add and edit routine form is generic: it starts with a Provider choice
("Claude Code" is the only one today) and shows the fields that provider declares. Everything provider-specific
(the trigger id or fire URL, the token, the fire request and how its answer reads) lives behind one provider adapter,
so a later provider is added as one more adapter without changing the form, the fire queue or the fire records.

## Context
The owner (2026-11-25 13:46 Warsaw, translated, with a screenshot of a routine row on the Routines tab): "the routines
we build now are tied to Claude, but in the end I want to add custom routines, not only Claude ones; so the form must
be generic, with a choice of provider, Claude now, maybe something else later; prepare it that way".
Today (master 454d4f7) the routine is Claude-only throughout: `modules/projects/migrations/0007_create_routines.sql`
(`trigger_id` with a Claude id pattern, no provider column), `src/routines/routines-api.ts` (the Anthropic routines
endpoint, version and beta header), `src/routines/trigger-id.ts` (parses a `trig_…` id or the Claude fire URL),
`src/routines/manage-routines.ts`, `src/routines/fire-handler.ts`, `src/routines/routine-forms.tsx`.

## Constraints
- A forward-only migration adds `provider` (`NOT NULL`, constrained to the known providers) and moves the
  Claude-specific columns behind it as the provider's settings; every existing routine becomes `provider = 'claude-code'`
  and keeps working, its token unchanged (no re-paste). The migration says how to roll back.
- A provider adapter declares its label, its fields (with "?" help, CT-12's `FieldHelp`), how it validates them, how it
  fires and tests with a text, and how it maps the answer to the existing fire result (status, reason, retry-after);
  the fire queue, the limits, the fire records and Retry stay provider-neutral.
- The kind list (CT-12) stays separate from the provider: a kind says what wakes the routine, a provider how it is called.
- The form uses CT-12's dialog; the provider is a `Select`, one option today, shown even with one option so the shape
  is visible.
- Secrets stay encrypted as today (AES-256-GCM under `ROUTINE_TOKEN_SECRET`); no new secret.
- No new provider is built now; no release, tag, publish or deploy.

## Notes
- Frame skipped: the owner described the target; the outcome is not in doubt. Research decides whether the provider
  settings become a JSON column with a schema per provider or stay columns with a provider check.
- Decisions (auto): `provider` is checked by format in the database and against the provider registry in code, so a
  provider registered only in a test can be stored; the Claude Code settings shape is a database check. Today no edit
  dialog exists (only "Replace token"), so the Provider choice goes into the add dialog; an edit form is not built.

## Done
- **CT-20** `routines-by-provider`: a routine has a provider and its settings (migration `projects/0008`: `provider`, `settings` jsonb; every routine moved to `claude-code` with its trigger id in `settings.triggerId`, its token unchanged); the add dialog starts with a Provider list (Claude Code) and shows that provider's fields; firing, Test and the answer go through a provider adapter (`src/routines/providers/`), the fire queue, limits, fire records and Retry unchanged; waiting: release; archived in `archive/2026-11-25-routines-by-provider/`
