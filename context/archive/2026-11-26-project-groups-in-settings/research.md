# Research: project-groups-in-settings

## How it works today (master d81f512)
- `projects.repositories` (migration 0001): `id`, `repository_key` (lower case `owner/name`), `full_name` (forge's case),
  no grouping column. Next migration number: 0009. Migrations run with `search_path` set to `projects`.
- `modules/projects/queries.ts`: `findRepositories`, `insertRepository` (`onConflictDoNothing`, unique violation as
  `projects.already_watched`), `deleteRepository`; errors as values (`Result`), logged with `errorLogLabel` only.
- `src/projects/add-repository.ts`: parses the name, probes forge access, inserts. `parseRepositoryName` yields
  `owner`, `key`.
- Settings (`app/(app)/settings/page.tsx`): sections Repositories, Team (admin), Account, each a `SectionCard`.
  Server actions in `app/(app)/settings/actions.ts` start with `requireUser()`.
- Row menus: theme-notion `RowActionsMenu` (CT-27) with `actions`, `destructiveAction.confirm`, `triggerRef`; a dialog
  opened from a menu returns focus to the trigger through `onCloseAutoFocus` (`src/routines/routine-forms.tsx`).
- Forms: `useActionState` with a `{ status, message }` state, `FieldError`, `LabelWithHelp` for "?" help
  (`src/shell/field-help.tsx`). zod narrows form input in the actions (`app/(app)/routines/actions.ts`).
- Tests: PGlite through `tests/support/test-context.ts` (all migrations applied); a migration's data move is tested by
  running its header rollback, inserting old-shape rows, then the migration SQL (`tests/projects/routine-provider-migration.test.ts`).
- e2e: one shared database, specs in parallel; the fake forge serves a fixed list (`e2e/fake-forge.ts`
  `FAKE_REPOSITORIES`), any owner allowed for the first token. The e2e database migrates empty, so the seed creates no
  group there: the e2e creates its groups with a "New projects from" owner and then adds repositories of that owner.
- Sorting today uses `localeCompare` ad hoc; no shared collator. `config.locale` is `en` or `pl`.
- Live tag: `v2026.11.25-3` (schema up to 0008).

## Answers to the unknowns
- Seed an owner with a single repository: yes (one rule; the owner merges groups by renaming and reassigning).

## Risks
- The migration rewrites production rows: covered by the seed test and by a run over a database migrated at
  `v2026.11.25-3` with rows of two owners.
- Settings must list empty groups (to rename or delete them) while `groupProjects` leaves them out: the Settings list
  uses the same name order (`compareGroupNames`) but not `groupProjects`.
- Shared e2e database: group names and owners used by the spec are unique per viewport; no count of a shared list is
  fixed upfront.

## SOFTURE modules
theme-notion 0.37.0 covers List/ListEntry/RowActionsMenu/Dialog/Field/Input: no package gap.
