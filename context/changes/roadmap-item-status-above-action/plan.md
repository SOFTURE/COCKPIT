# Plan: roadmap-item-status-above-action

## Approach
`ItemRow` stops passing `actions` to `FoldRow`. The summary grid gets three columns on every width: the right column
holds the status (with the owner-step badge) on top and, when the item has an action, an invisible inert copy of it
underneath to hold its place. The real action is laid over that copy from the `li` (`absolute top-8 right-2`: the
summary's 4 px top padding, the 24 px status line and the 4 px gap down; the 8 px side inset in). A `li:hover` rule
lights the summary, so the bar and the action read as one box.

## Key decisions
- The inert copy over a fixed reserved size: the control's width differs (button, icon-only on a phone, or the issue
  link), and the copy matches it in every case without measuring.
- On a phone the status stays in the right column too (it used to drop under the title): the column then holds the
  status and the icon-only button, both narrow.

## Phase 1: Status above the action, in the bar

- Files: `src/roadmap/roadmap-view.tsx`, `e2e/promote.spec.ts`, `CHANGELOG.md`.
- Mode: test-after (layout).
- Done when: an e2e checks, at 1280 px and on a 390 px phone, that LT-1's promote control lies inside the item's
  summary box, below the status pill and right-aligned with it, and that the row has no `fold-row-actions` strip;
  promote flows still pass; screenshots at 1280 and 390 in both themes inspected and stored under
  `cockpit/evidence/roadmap-item-status-above-action/`; gates and e2e green; the pull request's CI green before merge.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Status above the action, in the bar

#### Automated
- [ ] 1.1 `ItemRow`: status on top of the right column, the action under it inside the bar, no separate strip
- [ ] 1.2 e2e: the action lies inside the summary box under the status (1280 and 390 px)
- [ ] 1.3 Screenshots after (1280, 390; light, dark) inspected and stored
- [ ] 1.4 Gates green: typecheck, lint (language scan), test, e2e, doctor
