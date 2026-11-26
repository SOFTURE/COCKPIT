import type { Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";

/** What one answer of the server may take in the specs (Playwright's default expect timeout). */
const ANSWER_MS = 5_000;
/**
 * Sidebar links do not prefetch (no-prefetch.spec), and in Next 16 a navigation to a page the browser has not seen
 * takes two round trips: the page's answer, then the rest of its data. A refresh queued meanwhile merges into the
 * second trip.
 */
const SIDEBAR_NAVIGATION_MS = 2 * ANSWER_MS;
/** The two trips plus one merged refresh; a chain of refreshes that keeps replacing the navigation sends more. */
const MOST_REQUESTS_FOR_ONE_NAVIGATION = 3;

export interface SidebarTarget {
  /** The link's text in the Main list. */
  readonly link: string;
  /** The address the click opens, without the origin. */
  readonly path: string;
  /** The opened page's level-1 heading. */
  readonly heading: string;
}

/** Opens a screen from the sidebar and waits until it shows, as one navigation of two server answers. */
export async function openFromSidebar(page: Page, { link, path, heading }: SidebarTarget): Promise<void> {
  let requests = 0;
  const countRequest = (request: { url(): string; headers(): Record<string, string> }) => {
    const headers = request.headers();
    const isPrefetch = headers["next-router-prefetch"] !== undefined || headers["next-router-segment-prefetch"] !== undefined;
    if (new URL(request.url()).pathname === path && headers["rsc"] === "1" && !isPrefetch) {
      requests += 1;
    }
  };
  page.on("request", countRequest);
  try {
    await page.getByRole("list", { name: "Main" }).getByRole("link", { name: link, exact: true }).click();
    await expect(page).toHaveURL((url) => url.pathname === path, { timeout: SIDEBAR_NAVIGATION_MS });
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible({ timeout: SIDEBAR_NAVIGATION_MS });
  } finally {
    page.off("request", countRequest);
  }
  expect(requests).toBeLessThanOrEqual(MOST_REQUESTS_FOR_ONE_NAVIGATION);
}
