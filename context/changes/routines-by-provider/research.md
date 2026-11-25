# Research: routines-by-provider

## Where it lives
- Table `projects.routines` (`modules/projects/migrations/0007_create_routines.sql`, `modules/projects/schema.ts`):
  `trigger_id` (Claude id pattern) is the only provider-specific column; `token_ciphertext` / `token_last4` hold one
  sealed secret, which any provider needs, and stay generic.
- Claude-specific code: `src/routines/routines-api.ts` (endpoint, version and beta headers, status to reason mapping,
  `FireResult`) and `src/routines/trigger-id.ts` (id or fire URL). `formatIssueFireText` and `TEST_FIRE_TEXT` in
  `routines-api.ts` are provider-neutral (the text contract of `routines/cockpit-command.md`).
- Callers of the API: `src/routines/wake-issue.ts` (`WakeDependencies.api`, `fireClaimed`),
  `src/routines/manage-routines.ts` (`addProjectRoutine` parses the trigger, `testRoutine` takes `api`),
  `src/routines/wake-access.ts` and `app/(app)/routines/actions.ts` (build the API from `ROUTINES_API_URL`).
- Display: `src/routines/routines-tab.ts` (`RoutineView.triggerId`), `src/routines/routines-section.tsx` (row line),
  `src/routines/routine-forms.tsx` (add dialog with Name, Kind, Trigger, Token).
- Tests: `tests/routines/*` use `createFakeRoutinesApi` (a `RoutinesApi`); `tests/overview/build-overview.test.ts`
  builds a `StoredRoutine` with `triggerId`; `e2e/routines.spec.ts` fills the dialog by label and reads fires from the
  fake forge per trigger id (`e2e/fake-forge.ts`).
- Fire reasons are stored as `^[a-z_]{1,40}$` words and shown through `messages.wake.reasons`.

## Reuse
- CT-12's `FieldHelp`, `Dialog`, `Select` from `@softure-ai/theme-notion`; `routine-kinds.ts` as the pattern for a
  list the client form can import without server code.
- PGlite `client.exec` runs a migration file's statements, as `@softure-ai/db` does, for the migration test.

## Unknowns answered
- Settings as a validated JSON column or columns: a `jsonb` `settings` column, an object checked in the database, its
  shape checked per provider by the adapter (zod); the Claude Code shape (`triggerId` pattern) is also a database
  check, so the known provider keeps its invariant in the database. A new provider needs no migration.
- Provider column: `NOT NULL` with a format check; the known providers are the registry in code, so a provider
  registered only in a test can be stored. `addProjectRoutine` refuses a provider the registry does not know.
- The edit dialog: today a routine has no edit form, only "Replace token". The provider choice goes into the add
  dialog; an edit form is not built here.
