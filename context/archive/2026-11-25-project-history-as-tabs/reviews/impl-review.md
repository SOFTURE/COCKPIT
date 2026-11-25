# Implementation review: project-history-as-tabs

Reviewed 2026-11-25 on c9a3bb0 against plan.md and change.md.

## Lenses
- Plan drift: none. All five history tabs, the shared `PageTabs`/`TabPanel`/`pickTab`, and the project page, inbox,
  Broadcast and Team on them, as planned.
- Correctness: unknown `?tab=` falls back (unit + e2e); a failed block hides only its own count and shows its reason in
  its own tab (unit + e2e on `history-refused-app`); auth's `?notice=` opens Team's Invite tab so the confirmation is
  visible.
- Tests: `tests/shell/pick-tab.test.ts` (6), `tests/project-page/history-tabs.test.ts` (5); e2e history reads every tab
  by address with state icons at 1280 and 390; broadcast, team and polish follow the tabs. Full unit suite 694/694;
  e2e of the touched specs 26/26.
- Copy: every new label in `messages/en.ts` and `messages/pl.ts`; the Polish spec now also opens the history's Merges and
  Doctor tabs, Broadcast's Sent and Team's Invite.
- Security, migrations, dependencies: none touched.
- Visual: 48 screenshots (12 screens × 1280/390 × light/dark) inspected; no horizontal scroll, touch-sized tabs on a
  phone, the tab bar scrolls sideways on its own when the five tabs do not fit 390 px (the theme's TabBar behaviour,
  as on the project page).

## Decisions (auto)
- Section titles stay under the tabs (as the project page's Production and Broadcast/Team cards do) so each panel is a
  named region; no change.
- Release titles equal to the version are not repeated under it (the fixture and most forges name a release by its tag).
