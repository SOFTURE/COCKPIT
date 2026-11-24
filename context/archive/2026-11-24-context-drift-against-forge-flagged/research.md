# Research: context-drift-against-forge-flagged

## How it works today
- The scan stores each project's whole `context/state.json` in `projects.reads.state` (`modules/projects/reads.ts`)
  and the forge's latest release as `{ version, date }` (`date` is `YYYY-MM-DD`, `src/forge/releases.ts`
  `getLatestRelease`) in `overview.forge_facts.release` (`modules/overview/facts.ts`). Both facts drift needs are
  already stored, so no migration and no new forge read are needed.
- The overview builds one row per project in `src/overview/build-overview.ts` (`buildRow`) and draws it in
  `src/overview/overview-row.tsx` as chips. The project page (`app/(app)/projects/[owner]/[name]/page.tsx`, tabs since
  CT-5) loads `loadProjectPage`, which reads only `findReads`; it has no forge facts yet.
- `context/state.json` rows (`@softure-ai/skills` `context_state.py`, `parse_status`): a row
  `done_code (2026-11-20; waiting: release)` becomes `status: "done_code"`, `detail: "2026-11-20; waiting: release"`,
  `since: "2026-11-20"`. A row `done_code (waiting: release)` has `since: null`. The script collects every
  `done_code` row whose waiting part names a release into one owner-queue entry, `kind: "word"`, text
  `release: <ids> merged and waiting for a release`, `since` the earliest row date or the file's date.
- Done statuses that close a row: `done`, `dropped`, `carried`.

## Answers to the unknowns
- Comparison: dates. A row's date is its `since`, else the `since` of the owner queue's `release:` word entry (rows
  written without a date, as this repository's own). The release counts as newer only when its day is after the row's
  day (strictly): both are day-precise, and a release on the merge day may predate the merge.
- A roadmap whose rows are all `done_code (waiting: release)` is not "finished and still live": only when every row
  is `done` (or `dropped`/`carried`, with at least one `done`).
- Drift does not change the project's status (no new broken reason): it is a context chore, not a failure, and the
  CLI, MCP and digest status schemas stay as they are.

## Risks
- A false-looking flag right after a release until the session settles it: the copy says what settles it.

## Files
`src/drift/**` (new), `src/overview/build-overview.ts`, `src/overview/overview-row.tsx`,
`app/(app)/projects/[owner]/[name]/page.tsx`, `src/project-page/load-project-page.ts`, `messages/en.ts`,
`messages/pl.ts`, tests in `tests/drift/`, e2e.
