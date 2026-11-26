import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { pressScanNow } from "./press-scan-now.ts";

/** Longer than Scan status's 2-second refresh: an answer this slow made every refresh replace the one before. */
const SLOW_ANSWER_MS = 3_000;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

/** Holds back the server's answers for in-app navigations to `pathPrefix`, as a loaded server or a slow link does. */
async function slowDownNavigationsTo(page: Page, pathPrefix: string) {
  await page.route(
    (url) => url.pathname.startsWith(pathPrefix),
    async (route) => {
      if (route.request().headers()["rsc"] === "1") {
        await new Promise((resolve) => setTimeout(resolve, SLOW_ANSWER_MS));
      }
      await route.continue();
    },
  );
}

// A navigation to a page the browser has not seen takes two round trips in the router: the page's answer, then the
// rest of its data (with a refresh queued meanwhile merged into that second trip). The bug replaced that second trip
// with a new refresh every 2 seconds, so a slow answer never arrived and the person stayed on Scan status. How long the
// two trips take depends on the machine; how many requests the click causes does not.
const MOST_REQUESTS_FOR_ONE_NAVIGATION = 3;

test("after Scan now the sidebar still leaves Scan status when the next page answers slowly", async ({ page }) => {
  test.setTimeout(60_000);
  await signIn(page, "/scan-status");
  await pressScanNow(page);
  await slowDownNavigationsTo(page, "/projects");
  let requests = 0;
  page.on("request", (request) => {
    const headers = request.headers();
    const isPrefetch = headers["next-router-prefetch"] !== undefined || headers["next-router-segment-prefetch"] !== undefined;
    if (new URL(request.url()).pathname === "/projects" && headers["rsc"] === "1" && !isPrefetch) {
      requests += 1;
    }
  });

  await page.getByRole("list", { name: "Main" }).getByRole("link", { name: "Projects" }).click();

  await expect(page.getByRole("heading", { name: "Projects", level: 1 })).toBeVisible({ timeout: 10 * SLOW_ANSWER_MS });
  expect(requests).toBeLessThanOrEqual(MOST_REQUESTS_FOR_ONE_NAVIGATION);
});
