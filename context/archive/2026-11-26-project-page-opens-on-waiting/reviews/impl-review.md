# Implementation review: project-page-opens-on-waiting

Verdict: approve. The diff matches the plan: `buildProjectTabs` falls back to Waiting and loses `hasContent`; the doc
comment and the Routines field comment say so. The unit test covers every combination named in change.md, every
requested tab and the unknown, empty and unavailable keys. The e2e uses three repositories no other spec watches,
reproduces the bug on master code and asserts the current tab, the address without `?tab=`, the Waiting panel (empty
state or one entry) at 1280 and 390 px, and that `?tab=production` still opens Production. No other spec relied on
the old default (full e2e green). No migration, no package change, nothing outside the owned files besides the new
fixtures and spec. Findings: none.
