import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { READ_AT } from "./scan-until-settled.ts";
import { submitRepository } from "./submit-repository.ts";

// Shares the database with the other specs: their scans run too, so it asserts only on states every scan reaches.
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
