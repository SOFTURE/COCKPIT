# Research: scheduled-task-dialog

## How it works today (master 35ec138)
- `src/broadcast/broadcast-form.tsx` (CT-34) renders the grouped picker inline: a `FieldSet` with the legend and its
  "?" hint, Pick all / Clear all and "Selected: N of M", then one inner `FieldSet` per `groupProjects` section with a
  group `Checkbox` (all / some / none) and one labelled `Checkbox name="project"` per project. The rules live in
  `src/broadcast/project-picks.ts` (`countPicked`, `getGroupPickState`, `setPicked`), covered by
  `tests/broadcast/project-picks.test.ts`; the markup by `tests/broadcast/broadcast-form-markup.test.tsx`; the flows by
  `e2e/grouped-broadcast-picker.spec.ts` and `e2e/broadcast.spec.ts`.
- `app/(app)/scheduled/actions.ts` (CT-36) already has `createScheduledTaskAction` and `editScheduledTaskAction`
  (`(previous, formData)`, fields `taskId`, `title`, `prompt`, `runAt` as `YYYY-MM-DDTHH:mm`, `project[]`), returning
  `ScheduledTaskActionState` (`idle | saved | failed{message}`). The error code is mapped to a message only, so the form
  cannot tell which field it names.
- `src/scheduled/save-scheduled-task.ts` checks in this order: title, prompt, projects, time (`getRunInstant`, a
  minute's grace), watched projects. `createScheduledTask` inserts with `onConflictDoNothing` on the id, so a form that
  reuses an id after a save "saves" without creating: every opening of the New task dialog needs a fresh id.
- `app/(app)/scheduled/page.tsx` (CT-37) leaves the header's action slot empty; `PageLayout` passes `actions` to the
  theme's `PageHeader`. Scheduled rows (`scheduled-task-row.tsx`) carry the menu `ScheduledRowMenu` (Run now, Delete);
  `ScheduledRow` (`build-scheduled-rows.ts`) holds neither the prompt nor the project keys, so Edit needs them added.
- Dialog pattern: `src/projects/project-group-forms.tsx` (CT-30): `RowActionsMenu` item with `opensDialog: true`,
  `Dialog` + `DialogContent closeButtonSize="touch" onCloseAutoFocus` giving focus back to the menu button via
  `triggerRef`, a `useActionState` form wrapped by `closingOnSave`.
- Time helpers: `@softure-ai/core` has `getWallClock(instant, zone)`, `getZonedInstant(wallClock, zone)`,
  `getLocalDateTimeInstant`, `localDateTimeSchema`, `addCalendarDays`, `toCalendarDay`; `src/projects/format-time.ts`
  has `formatRelativeTime(locale, date, now)` (pure, client-safe).

## theme-notion 0.37.0
- `DialogContent` sizes: `default` (`sm:max-w-lg`, 512 px), `wide` (`lg:max-w-1/2`, 640 px at 1280), `sm` (scrolls
  inside, `sm:max-w-md`), `lg` (fixed height). None is "640 px from md, scrolls inside on a short screen, footer kept at
  the bottom on a phone": a gap for SOFTURE/AI (filed by this change).
- `DialogFooter`: `flex-col-reverse` on a phone (the last child, the primary button, comes first), row from `sm`.
- `Textarea` has `field-sizing-content`, so it grows with its text; a `max-h` caps it.
- No date or time picker (SOFTURE/AI#1509): the theme's `Input type="date"` / `type="time"`.
- `Button size="touch"` (44 px) with `md:h-7 md:px-2.5`, the app's control size.

## Risks
- Extracting the picker must leave Broadcast's markup unchanged (its markup test and two e2e specs stay as they are).
- The picker's column grid is per viewport (`lg:grid-cols-3 xl:grid-cols-4`); inside a 640 px dialog four columns would
  truncate every name, so the dialog needs a narrower layout option.
- `crypto.randomUUID()` in the browser needs a secure context: production is https and e2e runs on localhost.
