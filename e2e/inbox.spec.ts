import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";

// Shares the database with the other specs: it watches a repository no other spec uses and looks only at its rows.
test.describe.configure({ mode: "serial" });

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("after a scan the inbox lists the project's entries oldest first with their chips", async ({ page }) => {
  await signIn(page, "/settings");
  await page.getByLabel("Repository").fill("example-org/eta-app");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("status").first()).toContainText("example-org/eta-app is now watched.");
  await scanUntilSettled(page, ["example-org/eta-app"]);

  await page.goto("/inbox");
  const rows = page.getByRole("list", { name: "Entries waiting for you, oldest first" }).getByRole("listitem").filter({ hasText: "example-org/eta-app" });
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Approve the eta-app release plan");
  await expect(rows.nth(0)).toContainText("Decision");
  await expect(rows.nth(0)).toContainText("ET-4");
  await expect(rows.nth(0)).toContainText(/\d+ days/);
  await expect(rows.nth(1)).toContainText("Secret");
  await expect(rows.nth(1)).toContainText("never asks for or stores a secret");

  const inboxItem = page.getByRole("list", { name: "Main" }).getByRole("listitem").filter({ hasText: "Inbox" });
  await expect(inboxItem).toContainText(/\d+/);
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the inbox rows fit without horizontal scroll", async ({ page }) => {
    await signIn(page, "/inbox");
    await expect(page.getByRole("heading", { name: "Inbox", level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
