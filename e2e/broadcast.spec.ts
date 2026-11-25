import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { expectTouchTarget } from "./expect-touch-target.ts";
import { submitRepository } from "./submit-repository.ts";

// Shares the database with the other specs: it watches repositories no other spec uses, and sends only to them.
test.describe.configure({ mode: "serial" });

const OWN_PROJECTS = ["example-org/herald-app", "example-org/herald-web", "example-org/herald-docs"] as const;
const TITLE = "Bump the skills package";

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

async function watch(page: Page, names: readonly string[]) {
  await page.goto("/settings");
  for (const name of names) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
}

/**
 * Clears every pick, checks pick all and clear all, then picks only this spec's own projects. Other specs watch new
 * repositories in parallel, so the list may grow while this runs: counts are read from the page, never fixed upfront.
 */
async function pickOwnProjects(page: Page) {
  const group = page.getByRole("group", { name: "Projects" });
  const send = page.getByRole("button", { name: "Send broadcast" });
  const count = group.getByText(/^\d+ of \d+ picked$/);

  await group.getByRole("button", { name: "Clear all" }).click();
  await expect(count).toHaveText(/^0 of \d+ picked$/);
  for (const box of await group.getByRole("checkbox").all()) {
    await expect(box).not.toBeChecked();
  }
  await expect(group.getByRole("button", { name: "Clear all" })).toBeDisabled();
  await expect(send).toBeDisabled();

  // A repository watched in between arrives unpicked, so pick all again until every shown project is picked.
  await expect(async () => {
    const pickAll = group.getByRole("button", { name: "Pick all" });
    if (await pickAll.isEnabled()) {
      await pickAll.click();
    }
    await expect(count).toHaveText(/^(\d+) of \1 picked$/, { timeout: 1_000 });
    await expect(pickAll).toBeDisabled({ timeout: 1_000 });
  }).toPass();
  await group.getByRole("button", { name: "Clear all" }).click();

  for (const name of OWN_PROJECTS) {
    const box = group.getByRole("checkbox", { name, exact: true });
    await box.click();
    await expect(box).toBeChecked();
  }
  await expect(count).toHaveText(new RegExp(`^${String(OWN_PROJECTS.length)} of \\d+ picked$`));
}

async function createdIssues(request: import("@playwright/test").APIRequestContext, fullName: string) {
  const answer = await request.get(`http://127.0.0.1:${String(FAKE_FORGE_PORT)}/__issues/${fullName}`);
  return (await answer.json()) as { title: string; body: string; labels: string[] }[];
}

function projectRow(page: Page, fullName: string) {
  return page.getByRole("list", { name: "Projects this broadcast went to" }).getByRole("listitem").filter({ hasText: fullName });
}

test("a broadcast becomes one cockpit issue per labelled project, and a project without the label fails with a retry", async ({ page, request }) => {
  await signIn(page, "/settings");
  await watch(page, OWN_PROJECTS);

  await page.getByRole("list", { name: "Main" }).getByRole("link", { name: "Broadcast" }).click();
  await expect(page).toHaveURL(/\/broadcast$/);
  await page.getByLabel("Title").fill(TITLE);
  await page.getByLabel("Message").fill("Bump `@softure-ai/skills` and run the doctor with `--fix`.");
  await pickOwnProjects(page);
  await page.getByRole("button", { name: "Send broadcast" }).click();

  await expect(page).toHaveURL(/\/broadcast\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLE);
  for (const name of ["example-org/herald-app", "example-org/herald-web"]) {
    await expect(projectRow(page, name)).toContainText("Sent");
    await expect(projectRow(page, name).getByRole("link", { name: "Issue #1" })).toBeVisible();
  }
  await expect(projectRow(page, "example-org/herald-docs")).toContainText("Failed");
  await expect(projectRow(page, "example-org/herald-docs")).toContainText("The project has no cockpit label.");

  // A retry of the failed project fails again with the same reason and creates nothing.
  await projectRow(page, "example-org/herald-docs").getByRole("button", { name: "Retry example-org/herald-docs" }).click();
  await expect(projectRow(page, "example-org/herald-docs")).toContainText("Failed");

  for (const name of ["example-org/herald-app", "example-org/herald-web"]) {
    const issues = await createdIssues(request, name);
    expect(issues).toHaveLength(1);
    expect(issues[0]?.labels).toEqual(["cockpit"]);
    expect(issues[0]?.title).toBe(`COCKPIT command: ${TITLE}`);
    expect(issues[0]?.body).toMatch(/<!-- cockpit-broadcast: \{"id":"[0-9a-f-]{36}"\} -->$/);
  }
  expect(await createdIssues(request, "example-org/herald-docs")).toEqual([]);

  // "New" and "Sent" are tabs; the Sent tab counts the broadcasts and keeps itself in the address.
  await page.getByRole("list", { name: "Main" }).getByRole("link", { name: "Broadcast" }).click();
  const tabs = page.getByRole("navigation", { name: "Broadcast sections" });
  await expect(tabs.getByRole("link", { name: /^New/ })).toHaveAttribute("aria-current", "page");
  await tabs.getByRole("link", { name: /^Sent \d+$/ }).click();
  await expect(page).toHaveURL(/\/broadcast\?tab=sent$/);
  await expect(page.getByRole("list", { name: "Sent broadcasts, newest first" }).getByRole("listitem").filter({ hasText: TITLE })).toContainText(
    "2 sent · 0 done · 1 failed",
  );
  // The row's hover background starts where its list item starts and stays inside it, never past the list.
  const sent = page.getByRole("list", { name: "Sent broadcasts, newest first" }).getByRole("listitem").filter({ hasText: TITLE });
  // A bounding box is read once and does not wait: the header's refresh re-renders the list, so both boxes are read
  // and compared again until the row has a layout.
  await expect(async () => {
    const [item, link] = await Promise.all([sent.boundingBox(), sent.getByRole("link").boundingBox()]);
    expect(item).not.toBeNull();
    expect(link).not.toBeNull();
    if (item === null || link === null) {
      return;
    }
    expect(link.x).toBeCloseTo(item.x, 0);
    expect(link.x + link.width).toBeLessThanOrEqual(item.x + item.width + 0.5);
  }).toPass();
});

test("sending the same form twice creates no second issue", async ({ page, request }) => {
  await signIn(page, "/broadcast");
  await page.getByLabel("Title").fill("Run the doctor");
  await page.getByLabel("Message").fill("Run the doctor and fix what it finds.");
  await pickOwnProjects(page);
  // The second submit of the same form arrives while the first one is still sending.
  await page.evaluate(() => {
    const form = document.querySelector("input[name=broadcastId]")?.closest("form");
    form?.requestSubmit();
    form?.requestSubmit();
  });
  await expect(page).toHaveURL(/\/broadcast\/[0-9a-f-]{36}$/);
  await expect(projectRow(page, "example-org/herald-app")).toContainText("Sent");

  for (const name of ["example-org/herald-app", "example-org/herald-web"]) {
    const issues = await createdIssues(request, name);
    expect(issues.filter((issue) => issue.title === "COCKPIT command: Run the doctor")).toHaveLength(1);
  }
});

test("a sent broadcast is deleted from the list only after its confirmation dialog, and its issues stay in the projects", async ({ page, request }) => {
  await signIn(page, "/broadcast?tab=sent");
  const history = page.getByRole("list", { name: "Sent broadcasts, newest first" });
  const row = history.getByRole("listitem").filter({ hasText: "Run the doctor" });
  await expect(row).toHaveCount(1);

  // The trash can sits inside the row's box (the link that lights on hover), after the arrow.
  const link = row.getByRole("link");
  const trash = row.getByRole("button", { name: "Delete Run the doctor" });
  const linkBox = await link.boundingBox();
  const trashBox = await trash.boundingBox();
  const arrowBox = await link.locator("svg").last().boundingBox();
  expect(linkBox && trashBox && arrowBox).toBeTruthy();
  if (linkBox && trashBox && arrowBox) {
    expect(trashBox.x).toBeGreaterThanOrEqual(linkBox.x);
    expect(trashBox.x + trashBox.width).toBeLessThanOrEqual(linkBox.x + linkBox.width);
    expect(trashBox.y).toBeGreaterThanOrEqual(linkBox.y);
    expect(trashBox.y + trashBox.height).toBeLessThanOrEqual(linkBox.y + linkBox.height);
    expect(trashBox.x).toBeGreaterThanOrEqual(arrowBox.x + arrowBox.width);
  }

  // Cancel closes the confirmation dialog and keeps the broadcast.
  await row.getByRole("button", { name: "Delete Run the doctor" }).click();
  const confirm = page.getByRole("alertdialog", { name: "Delete this broadcast from COCKPIT?" });
  await expect(confirm).toContainText("Its issues in the projects stay; close them there if needed.");
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(row).toHaveCount(1);

  await row.getByRole("button", { name: "Delete Run the doctor" }).click();
  await confirm.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(history.getByRole("listitem").filter({ hasText: "Run the doctor" })).toHaveCount(0);
  await expect(history.getByRole("listitem").filter({ hasText: TITLE })).toHaveCount(1);

  for (const name of ["example-org/herald-app", "example-org/herald-web"]) {
    const issues = await createdIssues(request, name);
    expect(issues.filter((issue) => issue.title === "COCKPIT command: Run the doctor")).toHaveLength(1);
  }
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("every broadcast control is at least 44 px high and nothing scrolls sideways", async ({ page }) => {
    await signIn(page, "/broadcast");
    const rows = page.getByRole("group", { name: "Projects" }).getByRole("listitem");
    for (const row of await rows.all()) {
      await expectTouchTarget(row);
    }
    for (const control of [
      page.getByLabel("Title"),
      page.getByRole("button", { name: "Pick all" }),
      page.getByRole("button", { name: "Clear all" }),
      page.getByRole("button", { name: "Send broadcast" }),
    ]) {
      await expectTouchTarget(control);
    }
    const overflow = async () => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(await overflow()).toBeLessThanOrEqual(0);
    for (const tab of await page.getByRole("navigation", { name: "Broadcast sections" }).getByRole("link").all()) {
      await expectTouchTarget(tab);
    }

    await page.goto("/broadcast?tab=sent");
    const remove = page.getByRole("button", { name: `Delete ${TITLE}` });
    await expectTouchTarget(remove);
    expect(await overflow()).toBeLessThanOrEqual(0);

    await page.getByRole("list", { name: "Sent broadcasts, newest first" }).getByRole("link").filter({ hasText: TITLE }).click();
    const retry = page.getByRole("button", { name: "Retry example-org/herald-docs" });
    await expectTouchTarget(retry);
    await expectTouchTarget(page.getByRole("link", { name: "Issue #1" }).first());
    expect(await overflow()).toBeLessThanOrEqual(0);
  });
});
