import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";

// Shares the database with the other specs: it watches repositories no other spec uses and looks only at their pages.
test.describe.configure({ mode: "serial" });

const FORGE = `http://127.0.0.1:${String(FAKE_FORGE_PORT)}`;
/**
 * How long the roadmap page may take to open: it reads its file from the forge on every open (after picking the token
 * that reads the repository), which under the CI's four workers sharing two cores outlasts the 5-second default.
 */
const OPEN_FROM_FORGE_MS = 15_000;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

/** One tab of the project page's tab bar (CT-5), by its key. */
function tab(page: Page, key: string) {
  return page.getByRole("navigation", { name: "Sections of this project" }).locator(`[data-tab="${key}"]`);
}

async function expectTab(page: Page, key: string, label: string, count: number | null) {
  await expect(tab(page, key)).toContainText(label);
  const counter = tab(page, key).locator('[data-slot="tab-bar-count"]');
  if (count === null) {
    await expect(counter).toHaveCount(0);
  } else {
    await expect(counter).toHaveText(String(count));
  }
}

test("a project page shows its roadmap items in order, queued roadmaps, open changes, entries and links", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of ["example-org/omicron-app", "example-org/pi-app", "example-org/rho-app"]) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
  await scanUntilSettled(page, ["example-org/omicron-app", "example-org/pi-app", "example-org/rho-app"]);

  // The overview links to the page.
  await page.goto("/projects");
  await page.locator('[data-project="example-org/omicron-app"]').getByRole("link", { name: "example-org/omicron-app" }).click();
  await expect(page.getByRole("heading", { name: "example-org/omicron-app", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open the repository" })).toHaveAttribute("href", `${FORGE}/example-org/omicron-app`);

  // CT-5: the sections are tabs with icons and counters; what waits for the owner opens first.
  await expectTab(page, "waiting", "Waiting", 1);
  await expectTab(page, "roadmaps", "Roadmaps", 2);
  await expectTab(page, "changes", "Changes", 2);
  await expect(tab(page, "production")).toHaveCount(0);
  await expect(tab(page, "waiting")).toHaveAttribute("aria-current", "page");
  await expect(tab(page, "waiting").locator("svg")).toHaveCount(1);
  await expect(page.getByRole("region", { name: "Active roadmap" })).toHaveCount(0);

  // A tab is a link: it has its own address.
  await tab(page, "roadmaps").click();
  await expect(page).toHaveURL(/\/projects\/example-org\/omicron-app\?tab=roadmaps$/);
  await expect(tab(page, "roadmaps")).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("region", { name: "Waiting for you" })).toHaveCount(0);

  // FR-10: five items with ID, outcome and stage, in roadmap order.
  const items = page.getByRole("list", { name: "Roadmap items, in roadmap order" }).getByRole("listitem");
  await expect(items).toHaveCount(5);
  await expect(items.locator("[data-stage]")).toHaveText(["implement 2/3", "Ready to merge", "Blocked", "Ready", "Ready"]);
  await expect(items.nth(0)).toContainText("OM-4");
  await expect(items.nth(0)).toContainText("Search across notes");
  await expect(items.nth(0)).toContainText("phase 2 of 3");
  await expect(items.nth(2)).toContainText("waits for an upstream fix");
  await expect(items.nth(0).getByRole("link", { name: "Open the change" })).toHaveAttribute("href", `${FORGE}/example-org/omicron-app/tree/main/context/changes/omicron-om-4`);
  await expect(items.nth(1).getByRole("link")).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Active roadmap" })).toContainText("omicron-v1 · Omicron v1");
  await expect(page.getByRole("region", { name: "Active roadmap" })).toContainText("3 of 8 done");
  await expect(page.getByRole("region", { name: "Active roadmap" }).getByRole("link", { name: "Open the roadmap" })).toHaveAttribute("href", "/projects/example-org/omicron-app/roadmaps/omicron-v1");

  // Queued roadmaps with their start condition, and open changes.
  const queued = page.getByRole("list", { name: "Queued roadmaps" }).getByRole("listitem");
  await expect(queued).toHaveCount(1);
  await expect(queued).toContainText("Omicron v2");
  await expect(queued).toContainText("Starts: after omicron-v1 is released");
  await expect(queued.getByRole("link", { name: "Omicron v2" })).toHaveAttribute("href", "/projects/example-org/omicron-app/roadmaps/omicron-v2");
  await tab(page, "changes").click();
  await expect(page).toHaveURL(/\?tab=changes$/);
  const changes = page.getByRole("list", { name: "Open changes" }).getByRole("listitem");
  await expect(changes).toHaveCount(2);
  await expect(changes.nth(1)).toContainText("Fix the dates of imported notes");
  await expect(changes.nth(1)).toContainText("planned");
  await expect(changes.nth(1).getByRole("link", { name: "fix-note-dates" })).toHaveAttribute("href", `${FORGE}/example-org/omicron-app/tree/main/context/changes/fix-note-dates`);

  // The back button returns to the previous tab.
  await page.goBack();
  await expect(tab(page, "roadmaps")).toHaveAttribute("aria-current", "page");

  // The entry answers exactly as in the inbox (FR-5), from the Waiting tab, which the reload keeps.
  await tab(page, "waiting").click();
  await expect(page).toHaveURL(/\?tab=waiting$/);
  const entry = page.getByRole("list", { name: "Entries of this project waiting for you" }).getByRole("listitem");
  await expect(entry).toHaveCount(1);
  await expect(entry).toContainText("Approve the omicron-app sharing scope");
  await entry.getByRole("group", { name: "Your answer" }).getByRole("button", { name: "Later" }).click();
  await entry.getByRole("button", { name: "Send answer" }).click();
  await expect(entry.getByRole("link", { name: "Later · issue #1" })).toBeVisible({ timeout: 10_000 });
  await page.reload();
  await expect(tab(page, "waiting")).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("list", { name: "Entries of this project waiting for you" }).getByRole("listitem")).toContainText("Sent");
});

test("a project without an active roadmap says so", async ({ page }) => {
  await signIn(page, "/projects/example-org/rho-app?tab=roadmaps");
  await expect(page.getByRole("region", { name: "Active roadmap" })).toContainText("This project has no active roadmap.");
  await expect(page.getByRole("region", { name: "Queued roadmaps" })).toContainText("No roadmap is queued.");
  await expectTab(page, "waiting", "Waiting", 0);
  await expectTab(page, "roadmaps", "Roadmaps", 0);
  await tab(page, "waiting").click();
  await expect(page.getByRole("region", { name: "Waiting for you" })).toContainText("Nothing in this project waits for you.");
});

test("when the last read failed the page keeps the last good data and names the failure with its time", async ({ page }) => {
  await signIn(page, "/scan-status");
  await scanUntilSettled(page, { "example-org/pi-app": "Not readable" });

  await page.goto("/projects/example-org/pi-app?tab=roadmaps");
  const failure = page.getByRole("alert").filter({ hasText: "The last read failed" });
  await expect(failure).toContainText("The last read failed: Not readable");
  await expect(failure).toContainText(/The page shows the last good read, from \w{3} \d+, \d{4}/);
  await expect(page.getByRole("list", { name: "Roadmap items, in roadmap order" }).getByRole("listitem")).toContainText("AL-1");
});

test("a roadmap opens inside COCKPIT, parsed from its file: items with status, details, orders and owner steps", async ({ page }) => {
  await signIn(page, "/projects/example-org/omicron-app");
  // What waits for the owner is the tab that opens first.
  await expect(tab(page, "waiting")).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("region").first()).toHaveAccessibleName("Waiting for you");
  await expect(page.getByRole("list", { name: "Entries of this project waiting for you" })).toContainText("from roadmap.md");
  await tab(page, "roadmaps").click();
  await page.getByRole("region", { name: "Active roadmap" }).getByRole("link", { name: "Open the roadmap" }).click();

  await expect(page.getByRole("heading", { name: "Omicron v1", level: 1 })).toBeVisible({ timeout: OPEN_FROM_FORGE_MS });
  await expect(page.getByRole("link", { name: "Open on GitHub" })).toHaveAttribute("href", `${FORGE}/example-org/omicron-app/blob/main/context/foundation/roadmap.md`);
  await expect(page.locator("[data-fallback]")).toHaveCount(0);
  const items = page.getByRole("list", { name: "Roadmap items, in roadmap order" }).locator(":scope > li");
  await expect(items).toHaveCount(8);
  await expect(items.locator("[data-stage]")).toHaveText([
    "Done",
    "Done",
    "Done",
    "In progress",
    "Ready to merge",
    "Blocked",
    "Ready",
    "Ready",
  ]);
  await expect(items.locator("[data-status-detail]")).toHaveText(["Stage: implement 2/3", "waits for an upstream fix"]);
  const search = page.locator('[data-item="OM-4"]');
  await expect(search).toContainText("Search across notes");
  await expect(search).toContainText("ranked by how recently it changed.");
  await search.getByText("Search across notes").click();
  await expect(search.getByRole("table", { name: "Details of OM-4" })).toContainText("M");
  await expect(search).toContainText("Which index fits the note volume?");
  await expect(search.getByRole("link", { name: "OM-3" })).toHaveAttribute("href", "#item-OM-3");
  await expect(page.getByRole("region", { name: "Overview" })).toContainText("3 of 8 done");
  await expect(page.getByRole("region", { name: "Run-wide orders" })).toContainText("after OM-8");
  const steps = page.getByRole("region", { name: "Owner steps and decisions" });
  await expect(steps).toContainText("SHARE_SECRET");
  await expect(steps).toContainText("approve the sharing scope");
  await expect(steps.locator('[data-done="true"]')).toContainText("create the storage bucket");

  // A queued roadmap opens the same way, with its start condition.
  await page.getByRole("navigation", { name: "Breadcrumb" }).getByRole("link", { name: "example-org/omicron-app" }).click();
  await tab(page, "roadmaps").click();
  await page.getByRole("link", { name: "Omicron v2" }).click();
  await expect(page.getByRole("heading", { name: "Omicron v2", level: 1 })).toBeVisible({ timeout: OPEN_FROM_FORGE_MS });
  await expect(page.getByRole("region", { name: "Overview" })).toContainText("after omicron-v1 is released");
  await expect(page.getByRole("list", { name: "Roadmap items, in roadmap order" }).locator(":scope > li")).toHaveCount(2);
  // The progress sits on the overview's header row.
  await expect(page.getByRole("region", { name: "Overview" }).locator("[data-overview-progress]")).toContainText("0 of 5 done");
  // A messy item reads cleanly: the owner step apart, the change once, no HTML comments.
  const team = page.locator('[data-item="OV-1"]');
  await expect(team.locator("[data-owner-step-badge]")).toHaveText("Owner step");
  await expect(team.locator("[data-outcome]")).not.toContainText("TEAM_INVITE_SECRET");
  await team.getByText("shared notes per team").click();
  await expect(team.locator("[data-owner-step]")).toContainText("TEAM_INVITE_SECRET");
  const details = team.getByRole("table", { name: "Details of OV-1" });
  await expect(details).toContainText("P1");
  await expect(details).toContainText("omicron-ov-1");
  await expect(team.getByText("omicron-ov-1")).toHaveCount(1);
  await expect(team.locator('[data-field="Depends on"]')).toHaveCount(0);
  await expect(team.locator('[data-field="Feedback"]')).toContainText('"zespoly widza notatki"');
  await expect(team).not.toContainText("<!--");
});

test("a roadmap whose file cannot be read shows the state's items and says why", async ({ page }) => {
  await signIn(page, "/projects/example-org/pi-app?tab=roadmaps");
  await page.getByRole("region", { name: "Active roadmap" }).getByRole("link", { name: "Open the roadmap" }).click();
  const notice = page.locator("[data-fallback]");
  await expect(notice).toContainText("The roadmap file could not be read", { timeout: OPEN_FROM_FORGE_MS });
  await expect(notice).toContainText("does not find the file");
  await expect(page.getByRole("list", { name: "Roadmap items, in roadmap order" })).toContainText("AL-1");
});

test("an unknown roadmap is not found", async ({ page }) => {
  await signIn(page, "/projects/example-org/omicron-app");
  const response = await page.goto("/projects/example-org/omicron-app/roadmaps/nope");
  expect(response?.status()).toBe(404);
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the project page fits without horizontal scroll", async ({ page }) => {
    await signIn(page, "/projects/example-org/omicron-app");
    await expect(page.getByRole("heading", { name: "example-org/omicron-app", level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    // The tabs are touch-sized on a phone.
    for (const key of ["waiting", "roadmaps", "changes"]) {
      const box = await tab(page, key).boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      expect(box?.width).toBeGreaterThanOrEqual(44);
    }
  });

  test("the roadmap view fits without horizontal scroll", async ({ page }) => {
    await signIn(page, "/projects/example-org/omicron-app/roadmaps/omicron-v1");
    await expect(page.getByRole("heading", { name: "Omicron v1", level: 1 })).toBeVisible({ timeout: OPEN_FROM_FORGE_MS });
    await page.locator('[data-item="OM-4"]').getByText("Search across notes").click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
