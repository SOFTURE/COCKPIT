import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";

// Shares the database with the other specs: it watches a repository no other spec uses and looks only at its rows.
test.describe.configure({ mode: "serial" });

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("after a scan the inbox lists the project's entries oldest first with their chips", async ({ page }) => {
  await signIn(page, "/settings");
  await submitRepository(page, "example-org/eta-app");
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

test("a project tab shows only that project's entries without repeating its name", async ({ page }) => {
  await signIn(page, "/inbox");
  const tabs = page.getByRole("navigation", { name: "Projects with entries" });
  await expect(tabs.getByRole("link", { name: /^All/ })).toHaveAttribute("aria-current", "page");
  const projectTab = tabs.locator('[data-tab="example-org/eta-app"]');
  await expect(projectTab).toBeVisible();
  await expect(projectTab).not.toContainText("example-org");
  await projectTab.click();

  await expect(page).toHaveURL(/\/inbox\?project=example-org\/eta-app$/);
  await expect(projectTab).toHaveAttribute("aria-current", "page");
  const waiting = page.getByRole("region", { name: "Waiting for you" });
  await expect(waiting.getByRole("link", { name: "example-org/eta-app" })).toHaveAttribute("href", "/projects/example-org/eta-app");
  const rows = page.getByRole("list", { name: "Entries waiting for you, oldest first" }).getByRole("listitem");
  await expect(rows).toHaveCount(2);
  await expect(rows.nth(0)).toContainText("Approve the eta-app release plan");
  await expect(rows.nth(0).getByRole("link", { name: "example-org/eta-app" })).toHaveCount(0);
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
