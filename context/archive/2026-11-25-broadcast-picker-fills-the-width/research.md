# Research: broadcast-picker-fills-the-width

## Where it lives
- `src/broadcast/broadcast-form.tsx` (client component): `picked` is a `Set` of project keys in state, every watched
  project picked at first. The list is `<ul className="grid gap-1">`, one row per project, so it is always one column.
- Copy: `messages/en.ts` and `messages/pl.ts`, `broadcast.*` (`projectsLegend`, `projectsHint`).
- The send button is already disabled when nothing is picked (`picked.size === 0`).

## Tests touching it
- `e2e/broadcast.spec.ts` unpicks every project that is not its own one by one (`pickOwnProjects`) inside the group
  named "Projects". Clearing all first and ticking its own three is the natural place to cover the new button.
- No unit test renders the form (unit tests are for pure modules; the form is verified in e2e).

## Reuse
- `Button` from `@softure-ai/theme-notion` with `variant="outline"` and `size="touch"` plus `md:h-7 md:px-2.5`, as
  the header refresh control and the form's own send button do.
- Tailwind responsive `grid-cols-*` utilities; no theme package change is needed.
