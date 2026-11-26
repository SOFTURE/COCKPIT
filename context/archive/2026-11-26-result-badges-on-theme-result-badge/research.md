# Research: result-badges-on-theme-result-badge

## Today
- `src/shell/result-badge.tsx` (CT-18) wraps theme-notion's `Badge variant="tag"`: `data-result=<tone>`,
  `data-tone=<colour>`, the caller's attributes through a `data` prop, muted icon `CircleDashed`; `getResultColor`
  maps a tone to `TONE_COLORS`. 15 files import it; `src/status/state-colors.ts` and
  `src/adapters/deploy/deploy-step-looks.ts` import only its `ResultTone` type.
- theme-notion 0.37.0 (npm) ships `ResultBadge` (`src/notion/ResultBadge.tsx`): `tone`, `icon`, `isSpinning`
  (a `LoaderCircle` by default), `children`, `title` (defaults to a string word), `className`, and since 0.36.0 every
  other `span` prop (SOFTURE/AI#1493 closed): `data-*` reach the element. It renders `data-slot="result-badge"`,
  `data-tone=<tone>`, `data-color=<colour>`, `data-spinning`, and the word in a truncating
  `data-slot="result-badge-label"`; `Badge` is `max-w-full`. Muted icon: `CircleMinus`.
- Tests reading the old attributes: `tests/shell/result-badge.test.tsx`, `tests/inbox/answer-state-badge.test.tsx`,
  `tests/routines/wake-chip-markup.test.tsx`, `tests/routines/fired-issue-row-markup.test.tsx`,
  `tests/routines/routine-row-markup.test.tsx` (attribute order regexes); e2e `overview`, `health`, `deploy`,
  `deploys`, `packages`, `project-history` read `data-tone=<colour>`.
- Badges with no attribute of their own today: overview CI/quality-review chips, history merge, release, run, doctor
  and finding badges, a fire's badge, the packages version, update and unknown badges.

## Overlap
- CT-26 (`list-rows-on-theme-list-entry`, not merged yet) rewrites the same rows (`ListRow` to `ListEntry`) and bumps
  theme-notion to 0.37.0; this change touches only the badge lines, so the rebase after CT-26's merge is mechanical.
- CT-27 shares only `package.json`/`package-lock.json`.

## Decisions (auto)
- The muted icon: the theme's `CircleMinus` (one standard; the change.md unknown's recommendation).
- `ResultTone` goes with the local badge: callers use the theme's `Tone`.
- Every list-screen badge gets its own attribute (`data-run-chip`, `data-merge-state`, `data-release-state`,
  `data-run-result`, `data-doctor-state`, `data-finding-code`, `data-fire-state`, `data-package-version`,
  `data-package-update-state`, `data-packages-state`) so the baseline "every badge carries its screen's attribute"
  holds.
- e2e and unit tests read the tone from `data-tone` (tone names) and the colour from `data-color`.
