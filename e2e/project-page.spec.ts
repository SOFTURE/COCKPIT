import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";

// Shares the database with the other specs: it watches repositories no other spec uses and looks only at their pages.
test.describe.configure({ mode: "serial" });

const FORGE = `http://127.0.0.1:${String(FAKE_FORGE_PORT)}`;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

async function scanNow(page: Page, names: readonly string[]) {
  await page.goto("/scan-status");
  await page.getByRole("button", { name: "Scan now" }).click();
  const projects = page.getByRole("list", { name: "Projects by last read" });
  for (const name of names) {
    await expect(projects.getByRole("listitem").filter({ hasText: name })).toContainText("Read", { timeout: 10_000 });
  }
}

test("a project page shows its roadmap items in order, queued roadmaps, open changes, entries and links", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of ["example-org/omicron-app", "example-org/pi-app", "example-org/rho-app"]) {
    await page.getByLabel("Repository").fill(name);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
  await scanNow(page, ["example-org/omicron-app", "example-org/pi-app", "example-org/rho-app"]);

  // The overview links to the page.
  await page.goto("/projects");
  await page.locator('[data-project="example-org/omicron-app"]').getByRole("link", { name: "example-org/omicron-app" }).click();
  await expect(page.getByRole("heading", { name: "example-org/omicron-app", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the repository" })).toHaveAttribute("href", `${FORGE}/example-org/omicron-app`);

  // FR-10: five items with ID, outcome and stage, in roadmap order.
  const items = page.getByRole("list", { name: "Roadmap items, in roadmap order" }).getByRole("listitem");
  await expect(items).toHaveCount(5);
  await expect(items.locator("[data-stage]")).toHaveText(["implement 2/3", "ready_to_merge", "blocked", "ready", "ready"]);
  await expect(items.nth(0)).toContainText("OM-4");
  await expect(items.nth(0)).toContainText("Search across notes");
  await expect(items.nth(0)).toContainText("phase 2 of 3");
  await expect(items.nth(2)).toContainText("waits for an upstream fix");
  await expect(items.nth(0).getByRole("link", { name: "Open the change" })).toHaveAttribute("href", `${FORGE}/example-org/omicron-app/tree/main/context/changes/omicron-om-4`);
  await expect(items.nth(1).getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Active roadmap" })).toContainText("omicron-v1 · Omicron v1");
  await expect(page.getByRole("region", { name: "Active roadmap" })).toContainText("3 of 8 done");
  await expect(page.getByRole("link", { name: "Roadmap file" })).toHaveAttribute("href", `${FORGE}/example-org/omicron-app/blob/main/context/foundation/roadmap.md`);

  // Queued roadmaps with their start condition, and open changes.
  const queued = page.getByRole("list", { name: "Queued roadmaps" }).getByRole("listitem");
  await expect(queued).toHaveCount(1);
  await expect(queued).toContainText("Omicron v2");
  await expect(queued).toContainText("Starts: after omicron-v1 is released");
  await expect(queued.getByRole("link", { name: "Omicron v2" })).toHaveAttribute("href", `${FORGE}/example-org/omicron-app/blob/main/context/foundation/roadmaps/omicron-v2.md`);
  const changes = page.getByRole("list", { name: "Open changes" }).getByRole("listitem");
  await expect(changes).toHaveCount(2);
  await expect(changes.nth(1)).toContainText("Fix the dates of imported notes");
  await expect(changes.nth(1)).toContainText("planned");
  await expect(changes.nth(1).getByRole("link", { name: "fix-note-dates" })).toHaveAttribute("href", `${FORGE}/example-org/omicron-app/tree/main/context/changes/fix-note-dates`);

  // The entry answers exactly as in the inbox (FR-5).
  const entry = page.getByRole("list", { name: "Entries of this project waiting for you" }).getByRole("listitem");
  await expect(entry).toHaveCount(1);
  await expect(entry).toContainText("Approve the omicron-app sharing scope");
  await entry.getByRole("group", { name: "Your answer" }).getByRole("button", { name: "Later" }).click();
  await entry.getByRole("button", { name: "Send answer" }).click();
  await expect(entry.getByRole("link", { name: "Later · issue #1" })).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await expect(page.getByRole("list", { name: "Entries of this project waiting for you" }).getByRole("listitem")).toContainText("Sent");
});

test("a project without an active roadmap says so", async ({ page }) => {
  await signIn(page, "/projects/example-org/rho-app");
  await expect(page.getByRole("region", { name: "Active roadmap" })).toContainText("This project has no active roadmap.");
  await expect(page.getByRole("region", { name: "Queued roadmaps" })).toContainText("No roadmap is queued.");
  await expect(page.getByRole("region", { name: "Waiting for you" })).toContainText("Nothing in this project waits for you.");
});

test("when the last read failed the page keeps the last good data and names the failure with its time", async ({ page }) => {
  await signIn(page, "/scan-status");
  await scanNow(page, ["example-org/pi-app"]);
  const pi = page.getByRole("list", { name: "Projects by last read" }).getByRole("listitem").filter({ hasText: "example-org/pi-app" });
  await expect(pi).toContainText("Not readable", { timeout: 10_000 });

  await page.goto("/projects/example-org/pi-app");
  const failure = page.getByRole("alert").filter({ hasText: "The last read failed" });
  await expect(failure).toContainText("The last read failed: Not readable");
  await expect(failure).toContainText(/The page shows the last good read, from \w{3} \d+, \d{4}/);
  await expect(page.getByRole("list", { name: "Roadmap items, in roadmap order" }).getByRole("listitem")).toContainText("AL-1");
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the project page fits without horizontal scroll", async ({ page }) => {
    await signIn(page, "/projects/example-org/omicron-app");
    await expect(page.getByRole("heading", { name: "example-org/omicron-app", level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
