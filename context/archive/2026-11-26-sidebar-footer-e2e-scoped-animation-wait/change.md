---
change_id: sidebar-footer-e2e-scoped-animation-wait
title: "The sidebar footer e2e waits only for the footer's own animations"
status: archived
roadmap_item: null
branch: claude/project-thread-g1wxyi
created: 2026-11-26
updated: 2026-11-26
archived_at: 2026-11-26
---

## Intent
`e2e/sidebar-footer.spec.ts` passes every run, also while another spec's scan is running.

## Context
Before it measures the footer, the spec waits until no animation on the whole page is running
(`document.getAnimations()`). While a scan waits or runs, the header's Refresh icon spins
(`motion-safe:animate-spin` in `src/shell/refresh-control.tsx`), an infinite CSS animation, so the wait never ends and
the test times out. The specs share one database and scan in parallel, so this hits whenever a scan overlaps the
test; it failed locally with 8 workers. The wait exists only for the phone's sliding sheet: the measurement needs the
footer to be still, not the whole page.

## Constraints
- Spec only; no product change (the spinning icon is correct behaviour), no retries, no loosened assertion, no
  release.
- Do not touch `e2e/overview.spec.ts` or `e2e/project-groups.spec.ts` (another thread fixes them).

## Notes
- Research skipped: the cause is one line of the spec and one class in the header, recorded above.
- Frame skipped: a flaky e2e is a bug to fix at once (AGENTS.md → CI).

## Done
- The spec waits only for animations that move the footer (the footer, the phone's sheet, the footer's children), not
  for the header's Refresh icon, which spins while any scan runs.
- A new test keeps the Refresh icon spinning for its whole run and proves the footer is still measured.
