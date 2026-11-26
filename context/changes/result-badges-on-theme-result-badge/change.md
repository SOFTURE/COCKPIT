---
change_id: result-badges-on-theme-result-badge
title: "Every result badge on the theme's ResultBadge"
status: planned
roadmap_item: CT-28
created: 2026-11-26
updated: 2026-11-26
---

## Intent
Every result badge in COCKPIT (doctor, access, read, last call, fired issue, wake, drift, answer state, broadcast send, packages, deploys, health) is theme-notion's `ResultBadge` with the same tone, icon override, word, hover title and its own `data-*` attribute; the local `ResultBadge` and `getResultColor` are deleted (the colour comes from the theme's `TONE_COLORS`).

## Context
The roadmap item (cockpit-v4), verbatim:

### CT-28: Every result badge on the theme's ResultBadge
- **Change ID:** `result-badges-on-theme-result-badge`
- **Status:** blocked (SOFTURE/AI#1493)
- **Outcome:** every result badge in COCKPIT (doctor, access, read, last call, fired issue, wake, drift, answer state,
  broadcast send, packages, deploys, health) is theme-notion's `ResultBadge` with the same tone, icon override, word,
  hover title and its own `data-*` attribute; the local `ResultBadge` and `getResultColor` are deleted (the colour
  comes from the theme's `TONE_COLORS`).
- **Prerequisites:** CT-26; a theme-notion release that closes SOFTURE/AI#1493 (`data-*` passed through). The item's
  first phase bumps `@softure-ai/theme-notion` to that release when the nightly bump has not yet done so.
- **Touches (estimate):** `src/shell/result-badge.tsx` (deleted), `src/status/state-colors.ts`, the badge callers
  (`src/overview/overview-row.tsx`, `src/projects/repository-status.tsx`, `src/project-page/history/history-sections.tsx`,
  `src/routines/routines-section.tsx`, `src/routines/fired-issue-row.tsx`, `src/routines/wake-chip.tsx`,
  `src/drift/drift-flags.tsx`, `src/scan/read-status.tsx`, `src/inbox/answer-state-badge.tsx`,
  `src/broadcast/send-status.tsx`, `src/adapters/packages/packages-details.tsx`, `src/adapters/deploy/deploys-list.tsx`,
  `src/adapters/deploy/deploy-details.tsx`, `src/adapters/observability/health-chip.tsx`), `package.json` and
  `package-lock.json` (the bump), tests and e2e that read `data-result`/`data-tone`.
- **Size:** S
- **Unknowns:**
  - The muted tone's icon: the theme draws `CircleMinus` where the app drew `CircleDashed`; recommended, take the
    theme's (one standard). (owner: research; blocks: no)
- **Risk:** the local badge's `data-tone` named the colour and `data-result` the tone; the theme's `data-tone` names
  the tone and `data-color` the colour; every test and e2e reading them moves in this change.
- **Baseline:** today 15 files use the local badge; after: no file imports `src/shell/result-badge.tsx` (it is gone),
  and every `[data-slot=result-badge]` on the list screens carries its screen's `data-*` attribute.
- **Layout:** each badge where it is today (line 1 of a row's right column, or the chip it is); a long word truncates
  inside the badge with the full word on hover, never widening the column.
- **Verification:** unit tests per badge caller (tone, word, icon override, the `data-*` attribute, the spinning
  answer state); e2e on overview, inbox, routines, broadcast, history, deploys and packages reading the badges by
  `data-slot`, `data-tone` and their own attribute, at 1280 and 390 px. Screenshots of those screens at 1280 and
  390 px, light and dark, before and after, saved with `softure-evidence` and linked from the plan's Progress; the run
  looks at each one itself before READY. All CI jobs green before the merge; master CI green after it.
- **PRD refs:** F-2, F-3
- **Input:** context/changes/result-badges-on-theme-result-badge/change.md

Findings gathered while recording it (theme-notion 0.35.0 from npm, master 8b630c2):
- Owner, 2026-11-26 07:15Z (translated, F-3): "the changes that are done in the Notion package: bump them and carry
  them out still before the deployment, so that the app is switched over to the newest package".
- Owner, 2026-11-25 21:15Z (translated): "remember to test it properly and not to make such chaos": the Layout and
  Verification lines above are binding.
- Package: `ResultBadge` (0.34.0): `tone` (`Tone`, `default` included), `icon`, `isSpinning` (a `LoaderCircle` by
  default), `children`, `title` (defaults to a string word), `className`; renders `data-slot="result-badge"`,
  `data-tone=<tone>`, `data-color=<colour>`, `data-spinning`; the word truncates in `result-badge-label`.
- Gap filed as SOFTURE/AI#1493: no other prop reaches the badge, so the callers' `data-*` attributes
  (`data-doctor`, `data-access-status`, `data-last-call-badge`, `data-fired-badge`, `data-wake`, `data-drift`,
  `data-read-status`, `data-answer-state`, `data-deploy-production`, …) cannot be set.
- Local copy: `src/shell/result-badge.tsx` (`data-result=<tone>`, `data-tone=<colour>`, `data` prop, muted icon
  `CircleDashed`), `getResultColor` used by `src/status/state-colors.ts`.

## Constraints
- Owns exclusively: `src/shell/result-badge.tsx`, `src/status/state-colors.ts` and the badge callers named in the item, with their tests. Shares only `package.json`/`package-lock.json` with CT-27.
- Starts only once CT-26 is merged and a theme-notion release closing SOFTURE/AI#1493 is on npm.
- Build on `@softure-ai/theme-notion` (AGENTS.md "SOFTURE packages first"): use the package component as it is; a
  missing piece becomes an issue in SOFTURE/AI, never a local wrapper or override.
- The roadmap's binding layout rule for CT-25..CT-28 (section "Slices"): no screen ends up less tidy than its CT-24
  screenshot.
- Design tokens only, no raw colours; user-visible text, `aria-label` included, through `messages/en.ts` and
  `messages/pl.ts`.
- On a phone the right column wraps under the identity; controls at least 44 px.
- Each row's own `data-*` attributes stay, so the e2e specs keep finding rows.
- No migration. No release, tag, publish or deploy (the owner's word; F-3: the deploy waits for CT-25..CT-28).
- Every CI job green before the merge; master CI checked green after it. A test that fails once and passes on a rerun
  is a bug to fix in the same thread.
- Any problem found in a SOFTURE package or skill is filed in SOFTURE/AI (or SOFTURE/SKILLS) right away; skills are not
  touched.

## Notes
