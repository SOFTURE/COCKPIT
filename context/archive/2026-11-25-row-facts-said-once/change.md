---
change_id: row-facts-said-once
title: "Every list row says each fact once"
status: archived
roadmap_item: CT-24
branch: claude/project-thread-fgk820
created: 2026-11-25
updated: 2026-11-25
archived_at: 2026-11-25
---

## Intent
No list row in COCKPIT shows the same fact twice (a state icon beside a badge saying the same, a badge repeating a detail line) or puts plain information in its controls slot; the inbox's answered rows and history move "answered by" into the row's details, and the held packages move "no issue" into the details; every other list (overview, project page, history tab, deploys, packages, Team, Settings, Scan status) is audited and fixed where it repeats itself.

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-24: Every row says each fact once
- **Change ID:** `row-facts-said-once`
- **Status:** ready
- **Outcome:** no list row in COCKPIT shows the same fact twice (a state icon beside a badge saying the same, a badge
  repeating a detail line) or puts plain information in its controls slot; the inbox's answered rows and history move
  "answered by" into the row's details, and the held packages move "no issue" into the details; every other list
  (overview, project page, history tab, deploys, packages, Team, Settings, Scan status) is audited and fixed where it
  repeats itself.
- **Prerequisites:** CT-22
- **Touches (estimate):** `src/inbox/inbox-row.tsx`, `app/(app)/inbox/page.tsx`, `src/adapters/packages/packages-details.tsx`,
  and, where the audit finds a repeat, `src/overview/**`, `src/project-page/**`, `src/adapters/deploy/**`,
  `src/team/**`, `src/projects/**`, `app/(app)/scan-status/**`; related e2e specs.
- **Size:** M
- **Unknowns:**
  - The audit's full list of repeats beyond the two known ones (owner: research; blocks: no)
- **Risk:** the inbox is the densest screen; moving text out of the right column must not hide the answer form
  (`data-row-wide`).
- **Baseline:** today the inbox and held packages put text in the controls slot and the routine row repeats its
  state (fixed by CT-22); after: the change lists every list audited with its verdict, and an e2e per touched screen
  checks the right column holds only badges and controls, at 1280 and 390 px.
- **Layout:** the right column holds only state (badges) on line 1 and controls on line 2; who answered, issue
  references as text and times move to the muted line under the title on the left.
- **Verification:** for every list audited, the change records the verdict (clean, or what moved); an e2e per touched
  screen asserts the right column contains only badges and controls (no plain text spans), at 1280 and 390 px; a unit
  test per moved fact asserts it appears once in the row. Screenshots of every touched screen at 1280 and 390 px, light and dark, before and after, saved with `softure-evidence` and linked from the plan's Progress; the run looks at each one itself and fixes any wrap, overlap or misalignment before READY.
- **PRD refs:** F-2
- **Input:** context/archive/2026-11-25-row-facts-said-once/change.md

Findings gathered while recording it:
- Owner, 2026-11-25 21:15Z (translated): "remember to test it properly and not to make such chaos": the
  Layout and Verification lines above are binding.
- Builds on CT-22's rule in `src/shell/list-row.tsx`: each fact said once; the controls slot holds controls only.
- Code survey (master 064a5ee), known cases:
  - `src/inbox/inbox-row.tsx` (answered entries) and `app/(app)/inbox/page.tsx` (answered earlier): `actions` holds
    the issue link and an "answered by <name>" span, information rather than controls;
  - `src/adapters/packages/packages-details.tsx` (held packages): `actions` holds "no issue" text or the issue number;
  - the routine row's triple state is CT-22's.
- Lists to audit: overview (`src/overview/overview-row.tsx`), project page (`src/project-page/project-page-sections.tsx`),
  history tab (`src/project-page/history/history-sections.tsx`), deploys (`src/adapters/deploy/deploys-list.tsx`),
  packages, Team (`src/team/member-list.tsx`), Settings (`src/projects/watched-repository-list.tsx`), Scan status
  (`app/(app)/scan-status/page.tsx`).

## Constraints
- Owns exclusively: `src/inbox/**`, `app/(app)/inbox/page.tsx`, `src/adapters/packages/**`, and the audited list files named in the item; reads `src/routines/wake-chip.tsx` (CT-23's).
- Notion design primitives (`DropdownMenu`, `Button`, `Badge`, `Status`); design tokens only, no raw colours.
- User-visible text, `aria-label` included, through `messages/en.ts` and `messages/pl.ts`.
- On a phone the right column wraps under the identity; controls at least 44 px.
- Existing `data-*` selectors stay, so the e2e specs keep reading the rows.
- No migration. No release, tag, publish or deploy.
- Every CI job green before the merge; master CI checked green after it.

## Notes
- Frame skipped: the owner's standing rule; the outcome is not in doubt.
- Archived 2026-11-25: answered and put-off entries, held packages, merges, releases, the last package update and Scan
  status say each fact once; every list audited with its verdict in `research.md`; evidence in the project files under
  `cockpit/evidence/row-facts-said-once/`.

## Decisions (auto)
- The overview keeps its broken-reason lines: they say why the status is Broken and what to do next (research.md).
- An issue link is a reference, not a control: it sits in the details. A time under a badge that names its event stands
  without a verb.
