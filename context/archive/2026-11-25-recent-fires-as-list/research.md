# Research: recent-fires-as-list

## Today
- `src/routines/load-routines.ts` reads the project's routines and its last 50 fires (`findRecentFires(db, key, 50)`,
  newest id first, no time limit) and hands them to `buildRoutinesTab` (`src/routines/routines-tab.ts`).
- `buildRoutinesTab` groups the fires by issue (newest first) into `FiredIssue { number, title, url, wake }`; the
  wake (`getIssueWake`, `src/routines/wake-view.ts`) carries every fire of the issue and `canRetry`.
- `RoutinesSection` (`src/routines/routines-section.tsx`) renders the "Recent fires" card as a `ul` whose items are a
  link `#N title` with `IssueWakeStatus` (`src/routines/wake-chip.tsx`) under it: one `Status` per fire
  ("Routine fired", "Fire failed · HTTP 503 · API error"), the routine's name in the tooltip (CT-13), and a Retry
  form. No date and no time window, which is what the owner's screenshot (F-14) shows.
- `IssueWakeStatus` is shared with the broadcast page and the inbox; those stay as they are.
- `StoredFire` has `createdAt` (when the fire was first recorded, i.e. fired) and `updatedAt` (last attempt).

## Shared pieces
- `src/shell/row-inset.ts`: rows start `px-2` in; the bar layout of `StatusActionFoldRow`
  (`src/shell/status-action-fold-row.tsx`): identity left, status on top of the right column, action under it.
  The fire rows have nothing to fold, so they reuse the same bar layout on a plain `li` (CT-18 later turns this into
  the one shared list row).
- `Badge` (`variant="tag"`, colours green/red/gray/blue) from `@softure-ai/theme-notion`, as `LastCallBadge` does.

## Tests touching it
- `tests/routines/manage-routines.test.ts` calls `buildRoutinesTab(stored, [], true)`.
- `tests/routines/wake-chip-markup.test.tsx` renders markup with `renderToStaticMarkup`.
- `e2e/routines.spec.ts` asserts `[data-fired-issues]` contains `#1 COCKPIT command: <title>`.

## Risks
- Time window: count from `createdAt` of the issue's newest fire; filter in SQL (so 50 old rows never crowd out) and
  keep the row limit.
- No migration, no dependency change.
