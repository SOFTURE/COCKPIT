# Plan: queued-roadmap-promoted-to-work

## Approach
A pure formatter builds the promotion issue (title, body with the SOFTURE steps, marker
`<!-- cockpit-promote: {"roadmap": "<slug>", "item": "<ID>"|null} -->`). A use case `promoteRoadmap` checks the target is a
queued roadmap of a watched project and (for an item) that the item is open in its file, looks for an open issue with
the same marker (returns it), else creates one with the project's label, adopting a lost answer. The roadmap page reads
the open promotion issues once and shows a confirmed "Promuj do realizacji" control in the header (whole roadmap) and
under each open item, or the issue it became.

## Phase 1: Issue text, marker and the use case (TDD)
- Files: `src/roadmap/promotion-marker.ts`, `src/forge/issues.ts` (`formatPromotionIssue`),
  `src/roadmap/promote-roadmap.ts`, `tests/roadmap/promote-roadmap.test.ts`, `tests/forge/issues.test.ts`.
- Done when: unit tests cover later vs other queued text, whole vs item, existing open issue reused, closed one
  ignored, missing label refused, unknown/closed item refused, active roadmap refused, lost answer adopted.

## Phase 2: Roadmap view controls, action, messages, e2e
- Files: `src/roadmap/promote-form.tsx`, `src/roadmap/promote-form-state.ts`, `src/roadmap/load-roadmap-view.ts`,
  `src/roadmap/roadmap-view.tsx`, `app/(app)/projects/[owner]/[name]/roadmaps/[slug]/{page.tsx,actions.ts}`,
  `messages/{en,pl}.ts`, `e2e/promote.spec.ts`, `e2e/fake-forge.ts`.
- Done when: e2e: item promote creates one labelled issue with the marker, a second promote shows the same issue and
  creates none, whole-roadmap promote works, active roadmap shows no control; 390 px controls ≥ 44 px, no sideways
  scroll; screenshots 1280/390 light/dark looked at and saved to the project files.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Issue text, marker and the use case (TDD)

#### Automated
- [ ] 1.1 Marker and issue formatter with SOFTURE steps per roadmap kind
- [ ] 1.2 `promoteRoadmap` with dedupe, label, refusals and lost-answer adoption; unit tests green

### Phase 2: Roadmap view controls, action, messages, e2e

#### Automated
- [ ] 2.1 Controls with a confirm step in the header and per open item; the issue shown once sent
- [ ] 2.2 e2e for item, whole, repeat and phone; gates and full e2e green
- [ ] 2.3 Screenshots looked at and saved to the project files
