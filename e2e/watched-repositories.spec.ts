import { authMessages } from "@softure-ai/auth";
import type { Locator, Page } from "@playwright/test";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { expectStateInRightColumn } from "./expect-row-state.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository, waitForRepositoryList } from "./submit-repository.ts";
import { expectListEntryRows } from "./expect-list-entry-rows.ts";

// The tests share one database, so they run in order.
test.describe.configure({ mode: "serial" });

async function openSettings(page: Page) {
  await page.goto("/settings");
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
  await expect(page.getByRole("heading", { name: "Watched repositories" })).toBeVisible();
}

/** Every group's list of watched repositories on Settings (CT-32). */
function watchedList(page: Page): Locator {
  return page.getByRole("region", { name: "Watched repositories" }).locator("[data-slot=project-group-sections]");
}

async function add(page: Page, name: string) {
  await submitRepository(page, name);
}

test("a readable repository is added and appears in the sidebar", async ({ page }) => {
  await openSettings(page);
  await add(page, "example-org/alpha-app");
  await expect(page.getByRole("status")).toContainText("example-org/alpha-app is now watched.");
  // The repositories of example-org belong to no group: they list under No group (CT-32).
  const list = page.getByRole("list", { name: "Watched repositories: No group", exact: true });
  await expect(list.getByRole("listitem").filter({ hasText: "example-org/alpha-app" })).toContainText("Readable");
  await expectStateInRightColumn(page, list.getByRole("listitem").filter({ hasText: "example-org/alpha-app" }), "Readable");
  await expectListEntryRows(page, list, "23-settings-repositories");
  const sidebarProjects = page.getByRole("list", { name: "No group", exact: true });
  await expect(sidebarProjects.getByRole("link", { name: "example-org/alpha-app" })).toBeVisible();

  await sidebarProjects.getByRole("link", { name: "example-org/alpha-app" }).click();
  await expect(page.getByRole("heading", { name: "example-org/alpha-app", level: 1 })).toBeVisible();
});

test("a repository without state is added and marked no state yet", async ({ page }) => {
  await openSettings(page);
  await add(page, "example-org/beta-app");
  const row = watchedList(page).getByRole("listitem").filter({ hasText: "example-org/beta-app" });
  await expect(row).toContainText("No state yet");
  await expect(row).toContainText("Update @softure-ai/skills");
});

test("a repository with a refused read permission is added with that permission named", async ({ page }) => {
  await openSettings(page);
  await add(page, "example-org/delta-app");
  const row = watchedList(page).getByRole("listitem").filter({ hasText: "example-org/delta-app" });
  await expect(row).toContainText("Missing permissions");
  await expect(row).toContainText("Actions: read");
});

test("a repository COCKPIT cannot read is not added and the permission is named", async ({ page }) => {
  await openSettings(page);
  await add(page, "example-org/gamma-app");
  await expect(page.getByRole("status")).toContainText("Grant the access token: Contents: read.");
  await add(page, "example-org/unknown-app");
  await expect(page.getByRole("status")).toContainText("No access token finds this repository.");
  await expect(page.getByRole("status")).toContainText("whose resource owner is example-org to FORGE_EXTRA_TOKENS");
  await add(page, "not a repository");
  await expect(page.getByRole("status")).toContainText("Enter the repository as owner/name");
  await expect(watchedList(page)).not.toContainText("gamma-app");
});

test("a repository of a second owner is offered and read with that owner's token", async ({ page }) => {
  await openSettings(page);
  await waitForRepositoryList(page);
  const field = page.getByRole("combobox", { name: "Repository", exact: true });
  await field.click();
  await field.pressSequentially("rho-team");
  await expect(page.getByRole("option")).toHaveText(["example-team/rho-team-app"]);
  await add(page, "example-team/rho-team-app");
  await expect(page.getByRole("status")).toContainText("example-team/rho-team-app is now watched.");
  const row = watchedList(page).getByRole("listitem").filter({ hasText: "example-team/rho-team-app" });
  await expect(row).toContainText("Readable");
});

test("a repository is removed only after the confirmation dialog, and leaves the list and the sidebar", async ({ page }) => {
  await openSettings(page);
  const row = watchedList(page).getByRole("listitem").filter({ hasText: "example-org/beta-app" });

  // Cancel closes the dialog and keeps the repository.
  await row.getByRole("button", { name: "Remove example-org/beta-app" }).click();
  const confirm = page.getByRole("alertdialog", { name: "Stop watching example-org/beta-app?" });
  await expect(confirm).toContainText("the repository and the cockpit issues already in it stay");
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(row).toHaveCount(1);

  await row.getByRole("button", { name: "Remove example-org/beta-app" }).click();
  await confirm.getByRole("button", { name: "Remove", exact: true }).click();
  await expect(confirm).toHaveCount(0);
  await expect(watchedList(page)).not.toContainText("example-org/beta-app");
  await expect(page.getByRole("list", { name: "No group", exact: true }).getByRole("link", { name: "example-org/beta-app" })).toHaveCount(0);
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the settings screen has no horizontal scroll", async ({ page }) => {
    await openSettings(page);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
