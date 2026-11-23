# Implementation review: roadmap-status-pills-full-width

Reviewed against plan.md. Verdict: approve. Findings: 0 critical, 0 warnings.

- Drift: none. `STATUS_COLORS` was removed once nothing used it.
- Tests: `splitRoadmapTitle` covers split, no colon, a too-long prefix and an empty rest; the e2e spec asserts the
  pill words and the detail lines separately.
- Accessibility: the pill keeps its word (status never by colour alone); the icon is hidden from assistive tech.
- Layout: 390 px views fit without horizontal scroll (existing e2e checks).
