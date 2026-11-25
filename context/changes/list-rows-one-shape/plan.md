# Plan: list-rows-one-shape

## Approach
Two shared components in `src/shell/`, then each listed screen moves onto them without changing what a row says.

- `ResultBadge` (`result-badge.tsx`): a filled tag `Badge` with an icon and a word. The colour comes only from the
  theme's tone (`TONE_COLORS`): `success` green (done, fired), `danger` red (failed), `warning` orange (needs
  attention), `muted` gray (none, pending). Each domain keeps a small map from its states to a tone (and an icon).
- `ListRow` (`list-row.tsx`): an `li` with the identity on the left (a title, optional lines under it) and a right
  column with the state on top and the actions under it. A row that opens something (`href`) has its title as a
  link stretched over the whole row, so the row is one box lit on hover in the shared inset (`px-2`, rounded); the
  arrow sits first on the right column's top line and the actions stay above the stretched link. On a phone the right
  column wraps under the identity, right-aligned.

## Key decisions
- One filled badge for results (owner's CT-12 and CT-15 asked for coloured badges); `Status` stays for non-result
  marks elsewhere (CT-19 covers the project views).
- Broadcast "sent" (issue opened, not yet done) is pending: gray, with its Send icon. Fires "queued" and "sending"
  are pending: gray.
- Repository "no state" and scan "no state" are warnings (orange), as "needs attention".
- The broadcast history row keeps its arrow and trash can; its lit box is now the `li` itself; the e2e asserts that.
- Team tags (Admin, You) are the row's state slot, not results: they stay tags.

## Phase 1: ResultBadge and ListRow
- Files: `src/shell/result-badge.tsx`, `src/shell/list-row.tsx`, `tests/shell/result-badge.test.tsx`,
  `tests/shell/list-row-markup.test.tsx`.
- Mode: TDD.
- Done when: a unit test pins the tone colour map (success green, danger red, warning orange, muted gray) and the badge
  markup (icon, word, data attributes, title); a markup test pins the row's identity, state and actions slots and the
  stretched link.

## Phase 2: The listed screens use them
- Files: `app/(app)/broadcast/[id]/page.tsx`, `app/(app)/broadcast/page.tsx`, `app/(app)/scan-status/page.tsx`,
  `src/broadcast/send-status.tsx`, `src/scan/read-status.tsx`, `src/projects/repository-status.tsx`,
  `src/projects/watched-repository-list.tsx`, `src/team/member-list.tsx`, `src/routines/routines-section.tsx`,
  `src/routines/fired-issue-row.tsx`, `src/routines/wake-chip.tsx`, related tests and e2e, `CHANGELOG.md`.
- Mode: test-after (layout), unit tests updated where they pin colours.
- Done when: every listed screen renders its rows with `ListRow` and its results with `ResultBadge`; an e2e checks at
  1280 and 390 px that the state badge sits in the right column (`data-row-status`) on each listed screen; existing
  e2e pass; screenshots of each screen at 1280 and 390 px, light and dark, are looked at and stored.

## Phase 3: Gap filed, gates, review
- File the generic gap (a list row with a state and actions column, and a result badge) in SOFTURE/AI.
- Gates (typecheck, lint, test), build + e2e, doctor.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: ResultBadge and ListRow

#### Automated
- [ ] 1.1 Unit test pins the tone colour map and the badge markup
- [ ] 1.2 Markup test pins the row's slots and the stretched link

### Phase 2: The listed screens use them

#### Automated
- [ ] 2.1 Broadcast detail and history, Scan status, watched repositories, team members, routines and recent fires use `ListRow` and `ResultBadge`
- [ ] 2.2 e2e: the state badge sits in the right column on each listed screen at 1280 and 390 px
- [ ] 2.3 Screenshots of the listed screens at 1280 and 390 px, light and dark, looked at and stored

### Phase 3: Gap filed, gates, review

#### Automated
- [ ] 3.1 SOFTURE/AI issue for the generic row and result badge
- [ ] 3.2 Gates, build, e2e and doctor green
