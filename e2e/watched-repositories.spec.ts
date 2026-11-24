import { authMessages } from "@softure-ai/auth";
import type { Page } from "@playwright/test";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";

// The tests share one database, so they run in order.
test.describe.configure({ mode: "serial" });

async function openSettings(page: Page) {
  await page.goto("/settings");
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
  await expect(page.getByRole("heading", { name: "Watched repositories" })).toBeVisible();
}

async function add(page: Page, name: string) {
  await submitRepository(page, name);
}

test("a readable repository is added and appears in the sidebar", async ({ page }) => {
  await openSettings(page);
  await add(page, "example-org/alpha-app");
  await expect(page.getByRole("status")).toContainText("example-org/alpha-app is now watched.");
  const list = page.getByRole("list", { name: "Watched repositories" });
  await expect(list.getByRole("listitem").filter({ hasText: "example-org/alpha-app" })).toContainText("Readable");
  const sidebarProjects = page.getByRole("list", { name: "Projects" });
  await expect(sidebarProjects.getByRole("link", { name: "example-org/alpha-app" })).toBeVisible();

  await sidebarProjects.getByRole("link", { name: "example-org/alpha-app" }).click();
  await expect(page.getByRole("heading", { name: "example-org/alpha-app", level: 1 })).toBeVisible();
});

test("a repository without state is added and marked no state yet", async ({ page }) => {
  await openSettings(page);
  await add(page, "example-org/beta-app");
  const row = page.getByRole("list", { name: "Watched repositories" }).getByRole("listitem").filter({ hasText: "example-org/beta-app" });
  await expect(row).toContainText("No state yet");
  await expect(row).toContainText("Update @softure-ai/skills");
});

test("a repository with a refused read permission is added with that permission named", async ({ page }) => {
  await openSettings(page);
  await add(page, "example-org/delta-app");
  const row = page.getByRole("list", { name: "Watched repositories" }).getByRole("listitem").filter({ hasText: "example-org/delta-app" });
  await expect(row).toContainText("Missing permissions");
  await expect(row).toContainText("Actions: read");
});

test("a repository COCKPIT cannot read is not added and the permission is named", async ({ page }) => {
  await openSettings(page);
  await add(page, "example-org/gamma-app");
  await expect(page.getByRole("status")).toContainText("Grant the access token: Contents: read.");
  await add(page, "example-org/unknown-app");
  await expect(page.getByRole("status")).toContainText("Metadata: read");
  await add(page, "not a repository");
  await expect(page.getByRole("status")).toContainText("Enter the repository as owner/name");
  await expect(page.getByRole("list", { name: "Watched repositories" })).not.toContainText("gamma-app");
});

test("a removed repository leaves the list and the sidebar", async ({ page }) => {
  await openSettings(page);
  await page.getByRole("button", { name: "Remove example-org/beta-app" }).click();
  await expect(page.getByRole("list", { name: "Watched repositories" })).not.toContainText("example-org/beta-app");
  await expect(page.getByRole("list", { name: "Projects" }).getByRole("link", { name: "example-org/beta-app" })).toHaveCount(0);
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the settings screen has no horizontal scroll", async ({ page }) => {
    await openSettings(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
