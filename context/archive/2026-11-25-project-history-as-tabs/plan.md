# Plan: project-history-as-tabs

## Approach
One shared tab piece in `src/shell/`: a pure `pickTab` (the requested key when it is one of the shown tabs, else the
fallback) and a `PageTabs` component over `TabBar` that carries the touch size, the desktop height, icons as lucide
components hidden from assistive technology, and a `TabPanel` wrapper with `data-tab-panel`. The project page and the
inbox move onto it with no visual change. The history becomes five tabs (CI, Quality review, Merges, Releases,
Doctor) with counts, `?tab=` in the address, each tab one titled section whose rows carry a state icon and word.
Broadcast gets "New" and "Sent N", Team gets "Members N" and "Invite N".

## Key decisions
- Tab keys: history `ci | quality-review | merges | releases | doctor` (default `ci`); Broadcast `new | sent` (default
  `new`); Team `members | invite` (default `members`, `invite` when auth's `notice` parameter is present).
- A failed block's tab shows no count and its panel shows the failure; other tabs are unaffected. All four blocks are
  still read on every view because the counts need them (one forge round, as today).
- Doctor count: the failure total when failing (the listed findings when no total), none otherwise.
- Rows: merges `Status` purple `GitMerge` "Merged"; releases `Status` `Tag` "Published" (green) or "Prerelease"
  (yellow); doctor findings `Status` red `CircleX` with the code; runs keep their result `Status`.
- Each panel keeps a named region (`Section`) so assistive technology and the e2e find it by name.

## Phase 1: Shared tabs, history in tabs, every multi-section screen on them
- `src/shell/pick-tab.ts` (new): `pickTab<Key>(keys, requested, fallback)`, `tabHref(basePath, param, key)`. TDD:
  `tests/shell/pick-tab.test.ts`.
- `src/shell/page-tabs.tsx` (new): `PageTabs`, `TabPanel`.
- `src/project-page/history/history-tabs.ts` (new): `buildHistoryTabs(history, basePath, requested)` → tabs with counts
  and the current key. TDD: `tests/project-page/history-tabs.test.ts`.
- `history-sections.tsx`: `CiSection`, `QualityReviewSection` replace `RunsSection`; row state icons; empty line.
- History page, project page, inbox, Broadcast, Team pages on `PageTabs`/`TabPanel`; `project-tabs.ts` uses `pickTab`.
- Messages `en` and `pl`: tab labels, tab bar labels, row state words.
- e2e: history opens each tab by address and reads rows and state icons (1280 and 390); ci-from-pull-request, broadcast,
  team and polish follow the tabs.
- Done when: gates and e2e green; screenshots at 1280 and 390, light and dark, inspected.

## Progress

> `- [ ]` pending, `- [x]` done. A phase ends with ` — <commit sha>` on its done items. Never rename items.

### Phase 1: Shared tabs, history in tabs, every multi-section screen on them

#### Automated
- [x] 1.1 Unit tests for `pickTab` and `buildHistoryTabs` (fail first: 2 files failed before the modules existed; 11/11 after) — c9a3bb0
- [x] 1.2 Shared `PageTabs`/`TabPanel`; project page and inbox on it with no visual change — c9a3bb0
- [x] 1.3 History in five tabs with counts, state icons and one-line empty tabs — c9a3bb0
- [x] 1.4 Broadcast and Team on the shared tabs — c9a3bb0
- [x] 1.5 Gates green: typecheck, lint (language scan), test (694/694), doctor — c9a3bb0
- [x] 1.6 e2e green (build + Playwright), history tabs read by address at 1280 and 390 (touched specs 26/26; full suite in CI) — c9a3bb0
- [x] 1.7 Screenshots at 1280 and 390, light and dark, inspected and stored under the project files evidence folder (`cockpit/evidence/project-history-as-tabs/`, 48 files) — c9a3bb0
