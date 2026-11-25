# Plan: broadcast-picker-fills-the-width

## Approach
In `BroadcastForm`, add a row under the projects hint with a count ("12 of 12 picked") and two outline buttons,
"Pick all" and "Clear all" (`type="button"`, each disabled when it would change nothing). The checkbox list becomes
a responsive grid: one column on a phone, two from `sm`, three from `lg`, four from `xl`, with the full name
truncated and shown in full in its `title`.

## Key decisions
- Two buttons instead of one toggle: each says exactly what it does, and the disabled state shows where the list is.
- Column count by breakpoint, not by `auto-fill`: names are of similar length and the breakpoints match the app's.
- The count is plain text next to the buttons, so the state is readable without scanning the list.

## Phase 1: Picker in columns with pick all / clear all

- Files: `src/broadcast/broadcast-form.tsx`, `messages/en.ts`, `messages/pl.ts`, `e2e/broadcast.spec.ts`,
  `CHANGELOG.md`.
- Mode: test-after (the e2e drives the real form on a production build).
- Done when: the e2e clears all, sees every box unchecked and the send button disabled, picks all, sees every box
  checked, then clears all and ticks its own projects; screenshots at 1280 and 390 in both themes inspected and
  stored as evidence; gates green; the pull request's CI is green before the merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Picker in columns with pick all / clear all

#### Automated
- [ ] 1.1 Pick all / clear all with a count, and the list in responsive columns; copy in en and pl
- [ ] 1.2 e2e covers clear all, pick all and the disabled send button (production build)
- [ ] 1.3 Screenshots at 1280 and 390, light and dark, inspected and stored as evidence
- [ ] 1.4 Gates green: typecheck, lint (language scan), test, doctor
