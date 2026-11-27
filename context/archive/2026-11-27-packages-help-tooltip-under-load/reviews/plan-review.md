# Plan review: packages-help-tooltip-under-load

Verdict: approve.

- The fix follows the established helper; no new pattern (checked e2e/project-groups.spec.ts, project-settings.spec.ts,
  PR #170).
- `scanUntilSettled` runs under the hold already in project-page.spec (PR #170), so the scan step is unaffected.
- The criterion names the evidence (2- and 4-worker full runs); nothing is left manual.
- No product code changes, so no unit tests apply; the e2e is the test.

## Decisions (auto)
- Hold in `beforeEach` for the whole file rather than only around the tooltip: the phone-width test also reads the
  page while scans end, and one rule per spec is simpler.
