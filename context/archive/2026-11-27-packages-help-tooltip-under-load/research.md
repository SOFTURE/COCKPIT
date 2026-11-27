# Research: packages-help-tooltip-under-load

## How it works today
- `e2e/packages.spec.ts` watches four repositories of its own, scans them (`scanUntilSettled`), opens Packages and
  checks each card; at the end `expectFieldHelp` clicks the "?" of "No package update yet" and expects the tooltip.
- The spec does not hold the header's scan refresh. Other specs scan the shared database in parallel; while a scan is
  queued or running the header's `RefreshControl` (`src/shell/refresh-control.tsx`) polls `/api/scan-progress` every
  second, rewrites its live text ("2 of 5 refreshed") and calls `router.refresh()` once the scan ends.
- `FieldHelp` (`src/shell/field-help.tsx`) is a Radix tooltip opened by a click; Escape, a press elsewhere, a blur or
  the pointer leaving the trigger close it. A refresh that re-renders the page, or one that fails and makes Next reload
  the document (the cause found for #168 in PR #170), closes or drops the open tooltip before the assertion reads it.
- `e2e/hold-scan-refresh.ts` aborts `/api/scan-progress` for the test's browser context, so the header neither polls
  nor refreshes; project-groups, project-settings and (PR #170) project-page specs hold it in `beforeEach`.
- `scanUntilSettled` works with the hold: it reads the Scan status rows, which project-page.spec already relies on.

## Cause
Same class as CT-35 and #168: an open popover in a spec that lets another spec's scan end refresh the page under it.
Two workers rarely put a scan end inside the few hundred milliseconds between the click and the assertion; four do.

## Reproduction
- A full e2e with 4 workers on master (3e300c7) passed 128 of 128: the failure needs a scan end inside the second
  between the click and the assertion, so a plain rerun rarely hits it.
- A throwaway spec (not committed) opened Packages while a scan ran, opened the tooltip and watched it for 15 s while
  the scan ended:
  - refresh answered: tooltip stayed open (1 poll, 1 RSC request, 1 load);
  - refresh's RSC request aborted: Next reloaded the page (2 loads) and the tooltip was gone after 974 ms;
  - same failing refresh with `holdScanRefresh`: no RSC request, 1 load, tooltip stayed open.
- So the cause is the failed scan-end refresh (Next 16 turns it into `location.replace`), as in #168, not the refresh
  itself.
