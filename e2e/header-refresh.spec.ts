import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { READ_AT } from "./scan-until-settled.ts";
import { submitRepository } from "./submit-repository.ts";

// Runs on its own server and database (the `refresh` project): no other spec queues scans there, so the header's
// Refresh can wait for the scan queue to go idle.
test.describe.configure({ mode: "serial" });

/** How long a queued scan may take to start, and the least it is given to finish (FR-3: it starts within 10 seconds). */
const SCAN_MS = 30_000;
/**
 * How long one project's read may take while the other specs run beside it (`--workers=4` in CI). The scan reads every
 * watched project in turn, and the shared database holds every spec's projects, so its length grows with their count.
 */
const PROJECT_READ_MS = 3_000;

/** The time the running scan is given to finish: the projects it counts, read one after another. */
function getScanBudget(statusText: string): number {
  const match = /(\d+) of (\d+) refreshed/.exec(statusText);
  const total = match === null ? 0 : Number(match[2]);
  return Math.max(SCAN_MS, total * PROJECT_READ_MS);
}

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
  // FR-3: the scan starts within the budget; once it counts, it is given time for every project it counts.
  await expect(status).toHaveText(/\d+ of \d+ refreshed|Last read/, { timeout: SCAN_MS });
  const scanBudget = getScanBudget(await status.innerText());
  test.setTimeout(SCAN_MS * 3 + scanBudget);
  await expect(button).toBeEnabled({ timeout: scanBudget });
  await expect(status).toHaveText(/^Last read \w{3} \d+, \d{4}/, { timeout: SCAN_MS });

  // The scan the header started read both added projects.
  await page.goto("/scan-status");
  const list = page.getByRole("list", { name: "Projects by last read" });
  for (const name of ["example-org/refresh-one-app", "example-org/refresh-two-app"]) {
    await expect(list.getByRole("listitem").filter({ hasText: name })).toContainText(READ_AT);
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
