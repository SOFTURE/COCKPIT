# Research: grouped-broadcast-picker

Master `334d25f` (CT-30..CT-33 and CT-36 merged).

## How it works today
- `app/(app)/broadcast/page.tsx` loads the watched repositories and passes `{ key, fullName }` of each to
  `BroadcastForm` (`src/broadcast/broadcast-form.tsx`), a client form.
- The form keeps the picked keys in a `Set` (all picked at first); "Pick all" / "Clear all" are disabled when there is
  nothing to do; "{picked} of {total} picked" counts against the projects shown; Send is disabled at 0 picked.
- The "Projects" field is a theme `FieldSet` named by its legend's text alone (`aria-labelledby`), the hint behind a "?"
  (`LabelWithHelp`), then the buttons and the count, then one `ul` grid (1/2/3/4 columns) of theme `Checkbox`es with a
  `label` truncated and titled with the full name, 44 px rows on a phone.
- `src/broadcast/broadcast-form-state.ts` only holds the action's result type; no pure picking logic exists, and no
  unit test renders the form.
- CT-30 gives `groupProjects(projects, groups, { collator })`, `createGroupCollator(locale)`, `loadProjectGroups()`;
  `findRepositories` returns `groupId`. The layout (CT-33) and the Projects page (CT-32) are the reference callers.

## Theme 0.37
- `Checkbox` is Radix's: `checked="indeterminate"` renders `aria-checked="mixed"` and `data-state="indeterminate"`, and
  a click on an indeterminate box reports `true`. The theme styles only `data-state=checked` (filled box); an
  indeterminate box draws the same check icon in an outlined box, with no minus sign. That is a gap in the package
  (filed in SOFTURE/AI, below); the app uses the state as it is and adds no override.
- `FieldSet` is a `fieldset` with `flex flex-col gap-6`; `FieldLegend` a `legend` with `mb-3 font-medium`.

## e2e that read the picker
- `e2e/broadcast.spec.ts` finds the picker as the group "Projects" and its checkboxes by their label (`example-org/
  herald-*`, which no spec puts in a group, so they sit under No group). `pickOwnProjects` checks that every checkbox is
  clear after "Clear all": group checkboxes inside the field are clear then as well, so it keeps holding.
- `e2e/scheduled*` does not render the broadcast form yet (CT-38 moves the picker into a shared `ProjectPicker`).

## Risks
- Shared e2e database: fictional owners used by this spec only (`cedar-lane`, `birch-hall`) and
  `example-org/picker-loose-app`; counts read from the page, never fixed upfront.
