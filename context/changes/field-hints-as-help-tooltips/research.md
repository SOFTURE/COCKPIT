# Research: field-hints-as-help-tooltips

## Where it lives
- `src/shell/field-help.tsx` (client, CT-12): `FieldHelp({ id, label, text })`, a "?" button with a theme `Tooltip`
  (hover, focus, tap) and the text in an `sr-only` span with `id` for `aria-describedby`. Used three times in
  `src/routines/routine-forms.tsx`, each wrapped in the same `<span className="flex items-center gap-1">` with the
  label; the button name is `routines.fieldHelpLabel` ("Help: {field}").
- `src/broadcast/broadcast-form.tsx` (client): `projectsHint` paragraph under the `FieldLegend` of the projects
  `FieldSet`.
- `src/projects/add-repository-form.tsx` (client): `FieldDescription id="repository-hint"`; its text follows the
  suggestions state (`HINTS[suggestions.kind]`); the picker names it in `describedBy`.
- `src/settings/settings-row.tsx` (server): `hint` paragraph under the `h3` title; used by
  `app/(app)/settings/page.tsx` for password, assistant access and session.
- `src/adapters/deploy/deploys-list.tsx` (server): `deploys.secretsHint` paragraph under the red new-secrets badge;
  its text ends with a colon that introduces the list below it.
- `src/adapters/packages/packages-details.tsx` (server): `noUpdateHint` / `updateUnknownHint` beside the gray badge,
  once per package row.

## Reuse
- `FieldHelp` as is; React 19's `useId` is available in server components (`react.react-server` exports it), so the
  server rows can make their own ids.
- The repeated label-plus-"?" wrapper becomes one shared `LabelWithHelp` in `field-help.tsx`, used by Routines too.
- The help button name needs one app-wide message (`common`-level), not the routines-only `fieldHelpLabel`.

## Unknowns answered
- Tests touching these hints: `e2e/broadcast.spec.ts`, `e2e/settings.spec.ts`, `e2e/repository-picker.spec.ts`,
  deploy/packages e2e; any assertion on the visible hint text moves to the tooltip or the accessible description.
