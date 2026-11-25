import type { APIRequestContext, Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { expectTouchTarget } from "./expect-touch-target.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";
import { submitRepository } from "./submit-repository.ts";

// Shares the database with the other specs: it watches a repository no other spec uses (later-app).
test.describe.configure({ mode: "serial" });

const PROJECT = "example-org/later-app";
const ROADMAP_PATH = `/projects/${PROJECT}/roadmaps/later`;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

async function listIssues(request: APIRequestContext) {
  const answer = await request.get(`http://127.0.0.1:${String(FAKE_FORGE_PORT)}/__issues/${PROJECT}`);
  return (await answer.json()) as { title: string; body: string; labels: string[] }[];
}

function itemRow(page: Page, id: string) {
  return page.getByRole("list", { name: "Roadmap items, in roadmap order" }).locator(`[data-item="${id}"]`);
}

// The item's status sits on top of the bar's right column and its action right under it, inside the bar (the
// summary's box), not in a strip of its own beside it.
async function expectActionUnderStatus(page: Page, id: string) {
  const row = itemRow(page, id);
  await expect(row.locator("[data-slot=fold-row-actions]")).toHaveCount(0);
  const bar = await row.locator("[data-slot=fold-row-summary]").boundingBox();
  const status = await row.locator("[data-row-status]").boundingBox();
  const action = await row.locator("[data-row-action]").boundingBox();
  if (bar === null || status === null || action === null) {
    throw new Error(`The bar, status or action of ${id} is not drawn`);
  }
  expect(action.y).toBeGreaterThanOrEqual(status.y + status.height);
  expect(action.y + action.height).toBeLessThanOrEqual(bar.y + bar.height);
  expect(action.x).toBeGreaterThanOrEqual(bar.x);
  expect(Math.abs(action.x + action.width - (status.x + status.width))).toBeLessThanOrEqual(1);
  expect(action.x + action.width).toBeLessThanOrEqual(bar.x + bar.width);
}

test("an item of the later roadmap is promoted to work once, after a confirmation", async ({ page, request }) => {
  await signIn(page, "/settings");
  await submitRepository(page, PROJECT);
  await expect(page.getByRole("status").first()).toContainText(`${PROJECT} is now watched.`);
  await scanUntilSettled(page, [PROJECT]);

  await page.goto(ROADMAP_PATH);
  // A done item has nothing to promote.
  await expect(itemRow(page, "LT-3").getByRole("button", { name: "Promote LT-3 to work" })).toHaveCount(0);
  await expect(itemRow(page, "LT-3").locator("[data-row-action]")).toHaveCount(0);
  // One button per row: the invisible copy that holds the action's place is hidden from roles.
  await expect(itemRow(page, "LT-1").getByRole("button", { name: "Promote LT-1 to work" })).toHaveCount(1);
  await expectActionUnderStatus(page, "LT-1");

  await itemRow(page, "LT-1").getByRole("button", { name: "Promote LT-1 to work" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("Promote LT-1 to work?");
  await expect(dialog).toContainText(`COCKPIT creates one cockpit issue in ${PROJECT}.`);
  // Cancel sends nothing.
  await dialog.getByRole("button", { name: "Cancel" }).click();
  expect(await listIssues(request)).toEqual([]);

  await itemRow(page, "LT-1").getByRole("button", { name: "Promote LT-1 to work" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Send" }).click();
  await expect(itemRow(page, "LT-1").getByRole("link", { name: "Sent to work · issue #1" })).toBeVisible();

  const issues = await listIssues(request);
  expect(issues).toHaveLength(1);
  expect(issues[0]?.labels).toEqual(["cockpit"]);
  expect(issues[0]?.title).toBe("COCKPIT command: promote LT-1 to work, Customer quotes");
  expect(issues[0]?.body).toContain('<!-- cockpit-promote: {"roadmap":"later","item":"LT-1"} -->');
  expect(issues[0]?.body).toContain("Mark its row in `context/foundation/roadmaps/roadmap-later.md` `carried (to roadmap.md <new ID>, #<this issue>)`");

  // After a reload the item shows the issue it became, and no button invites a second one.
  await page.reload();
  await expect(itemRow(page, "LT-1").getByRole("link", { name: "Sent to work · issue #1" })).toBeVisible();
  await expect(itemRow(page, "LT-1").getByRole("button", { name: "Promote LT-1 to work" })).toHaveCount(0);
  await expectActionUnderStatus(page, "LT-1");
  await expect(itemRow(page, "LT-2").getByRole("button", { name: "Promote LT-2 to work" })).toBeVisible();
});

test("the whole later roadmap is promoted once and its open items point at that issue", async ({ page, request }) => {
  await signIn(page, ROADMAP_PATH);
  await page.getByRole("button", { name: "Promote the whole roadmap to work" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Promote the whole roadmap “later” to work?");
  await page.getByRole("alertdialog").getByRole("button", { name: "Send" }).click();
  await expect(page.getByRole("link", { name: "Sent to work · issue #2" })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("link", { name: "Whole roadmap sent · issue #2" }).first()).toBeVisible();
  // LT-1 keeps its own issue; LT-2 is covered by the whole roadmap's.
  await expect(itemRow(page, "LT-1").getByRole("link", { name: "Sent to work · issue #1" })).toBeVisible();
  await expect(itemRow(page, "LT-2").getByRole("link", { name: "Whole roadmap sent · issue #2" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Promote/ })).toHaveCount(0);

  const issues = await listIssues(request);
  expect(issues).toHaveLength(2);
  expect(issues[1]?.title).toBe("COCKPIT command: promote the whole later roadmap to work");
  expect(issues[1]?.body).toContain("- **LT-1** Customer quotes");
  expect(issues[1]?.body).toContain("- **LT-2** Tracked profile links");
  expect(issues[1]?.body).not.toContain("LT-3");
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the promote controls are at least 44 px high and nothing scrolls sideways", async ({ page }) => {
    await signIn(page, ROADMAP_PATH);
    for (const link of await page.locator("[data-promoted]").all()) {
      await expectTouchTarget(link);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await expectActionUnderStatus(page, "LT-1");
    await expectActionUnderStatus(page, "LT-2");
  });
});
