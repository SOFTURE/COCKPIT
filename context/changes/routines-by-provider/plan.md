# Plan: routines-by-provider

## Approach
A routine carries `provider` and `settings` (jsonb) instead of `trigger_id`; migration `0008` moves every
`trigger_id` into `settings.triggerId` with `provider = 'claude-code'`, the sealed token untouched. A provider adapter
(`src/routines/providers/contract.ts`) declares its id, its setting fields, `parseSettings` (form input),
`readSettings` (stored value, narrowed from `unknown`), `describe` (the row's line) and `fire` (text in, the existing
`FireResult` out). The Claude Code adapter (`src/routines/providers/claude-code/`) wraps the moved
`routines-api.ts` and `trigger-id.ts`. Wake, Test, the fire queue, limits and fire records take a provider registry
instead of the API. The add dialog starts with a Provider select (one option) and shows the chosen provider's fields
from a client-safe field list (`modules/projects/routine-providers.ts`).

## Key decisions
- One sealed secret per routine stays generic (`token_*`); providers declare only their non-secret fields.
- Provider ids are checked by format in the database and against the registry in code.
- A routine whose provider is not registered, or whose stored settings do not read, fails its fire with the reasons
  `provider_unknown` / `settings_invalid` (shown in words), never throws.
- Form inputs for settings are named `settings.<field>`; the old error `trigger_invalid` becomes
  `settings_invalid`, its message per provider.
- Log lines name `provider` and `routine_id`; the trigger id is no longer logged (it is the provider's detail).

## Phase 1: Migration and storage (TDD)
- `modules/projects/migrations/0008_add_routine_provider.sql` (new), `modules/projects/schema.ts`,
  `modules/projects/routines.ts`, `modules/projects/routine-providers.ts` (new),
  `tests/projects/routine-provider-migration.test.ts` (new).
- Done when: a test rolls the table back to the 0007 shape, stores a Claude routine there, runs 0008 and finds it as
  `claude-code` with `settings.triggerId`, its token still opening, and fires it through the fake API.

## Phase 2: Provider adapter and wiring (TDD)
- `src/routines/providers/{contract,registry}.ts` (new), `src/routines/providers/claude-code/{routines-api,trigger-id,provider}.ts`
  (moved / new), `src/routines/fire-text.ts` (new), `src/routines/{wake-issue,manage-routines,wake-access,routines-tab}.ts`,
  `app/(app)/routines/actions.ts`, `tests/routines/**`, `tests/overview/build-overview.test.ts`.
- Done when: a unit test registers a fake second provider only in the test, adds a routine of it and wakes an issue
  through it; the existing routines tests pass against the Claude Code adapter.

## Phase 3: Provider in the add dialog (test-after)
- `src/routines/routine-forms.tsx`, `src/routines/routines-section.tsx`, `messages/{en,pl}.ts`, `e2e/routines.spec.ts`,
  `CHANGELOG.md`.
- Done when: the e2e opens the add dialog, sees the Provider list with "Claude Code" chosen, adds a routine through
  it and the routine fires; screenshots at 1280 and 390, light and dark, are looked at; gates green.

## Progress

### Phase 1: Migration and storage
- [ ] 1.1 Migration 0008, schema and storage types, migration test first

### Phase 2: Provider adapter and wiring
- [ ] 2.1 Contract, registry, Claude Code adapter, fire text moved
- [ ] 2.2 Wake, Test, add and actions through the registry; fake second provider test

### Phase 3: Provider in the add dialog
- [ ] 3.1 Provider select and provider fields in the add dialog, row shows provider and its line
- [ ] 3.2 e2e and evidence screenshots looked at
- [ ] 3.3 Gates green
