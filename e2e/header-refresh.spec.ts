import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { pressScanNow } from "./press-scan-now.ts";
import { CHECKED_AT } from "./scan-until-settled.ts";
import { submitRepository } from "./submit-repository.ts";

// Runs on its own server and database (the `refresh` project): no other spec queues scans there, so the header's
// Refresh can wait for the scan queue to go idle.
test.describe.configure({ mode: "serial" });

/** How long a queued scan may take to start and finish (FR-3: it starts within 10 seconds). */
const SCAN_MS = 30_000;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("the header's Refresh scans every project, counts them live and ends with the last read time", async ({ page }) => {
  test.setTimeout(SCAN_MS * 3);
  await signIn(page, "/settings");
  for (const name of ["example-org/refresh-one-app", "example-org/refresh-two-app"]) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }

  await page.goto("/inbox");
  const header = page.getByRole("group", { name: "Refresh of every project" });
  const button = header.getByRole("button", { name: "Refresh" });
  const status = header.locator('[aria-live="polite"]');
  await expect(button).toBeVisible();

  await button.click();
  // While the scan waits or runs the button is busy; the counter or the queued line shows in the status.
  await expect(status).toHaveText(/Refresh queued…|Refreshing…|\d+ of \d+ refreshed|Last read/);
  await expect(button).toBeEnabled({ timeout: SCAN_MS });
  await expect(status).toHaveText(/^Last read \w{3} \d+, \d{4}/, { timeout: SCAN_MS });

  // The scan the header started read both added projects.
  await page.goto("/scan-status");
  const list = page.getByRole("region", { name: "Projects", exact: true });
  for (const name of ["example-org/refresh-one-app", "example-org/refresh-two-app"]) {
    await expect(list.getByRole("listitem").filter({ hasText: name })).toContainText(CHECKED_AT);
  }
});

test("the header fits a phone: the menu on the left, the refresh on the right, no sideways scroll", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await signIn(page, "/inbox");
  const header = page.getByRole("group", { name: "Refresh of every project" });
  const refresh = header.getByRole("button", { name: "Refresh" });
  const menu = page.getByRole("main").getByRole("button", { name: "Toggle sidebar" });
  await expect(refresh).toBeVisible();
  await expect(menu).toBeVisible();
  const [menuBox, refreshBox] = await Promise.all([menu.boundingBox(), refresh.boundingBox()]);
  expect(menuBox !== null && refreshBox !== null && menuBox.x < refreshBox.x).toBe(true);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
});

// On this database no other spec queues scans, so once the scan Scan now queued is over, nothing should refresh the page.
test("Scan status stops refreshing itself once the scan it queued is over", async ({ page }) => {
  await signIn(page, "/scan-status");
  await pressScanNow(page);
  await expect(page.getByText("A scan is running or waiting for the worker.")).toBeHidden({ timeout: 30_000 });
  // The header's Refresh reloads the page once when it sees the scan end; once it says when the projects were last read
  // and the network is quiet, that reload is done too.
  await expect(page.getByRole("group", { name: "Refresh of every project" })).toContainText(/Last read|Not read yet/, { timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  let refreshes = 0;
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/scan-status" && request.headers()["rsc"] === "1") {
      refreshes += 1;
    }
  });
  // Three of the old 2-second refreshes.
  await page.waitForTimeout(6_000);
  expect(refreshes).toBe(0);
});
