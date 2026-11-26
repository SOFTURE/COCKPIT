import type { Page } from "@playwright/test";

/**
 * Other specs scan the shared database in parallel. A page rendered while a scan runs polls the scan's progress and
 * reloads its data when the scan ends (the header's refresh, CT-9): that closes an open select or dialog, or brings in
 * what another tab changed before the test looks at it. Under the CI's load the scans follow each other for minutes, so
 * waiting for an idle header does not work. This leaves the poll unanswered for every page of the test's context, so
 * the page reloads nothing by itself; header-refresh.spec covers the reload itself.
 */
export async function holdScanRefresh(page: Page) {
  await page.context().route("**/api/scan-progress", (route) => route.abort());
}
