import type { Locator, Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { expectFieldHelp } from "./field-help.ts";
import { E2E_ROUTINE_TOKEN, FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { captureEvidence } from "./capture-evidence.ts";
import { expectSendRowLayout } from "./expect-send-row.ts";
import { expectTouchTarget } from "./expect-touch-target.ts";
import { submitRepository } from "./submit-repository.ts";
import { waitForHydration } from "./wait-for-hydration.ts";

// Shares the database with the other specs: it watches repositories no other spec uses, and sends only to them.
test.describe.configure({ mode: "serial" });

const OWN_PROJECTS = ["example-org/herald-app", "example-org/herald-web", "example-org/herald-docs"] as const;
const TITLE = "Bump the skills package";
const APP_TRIGGER = "trig_e2e_herald_app";

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
  const group = page.getByRole("group", { name: "Projects", exact: true });
  const send = page.getByRole("button", { name: "Send broadcast" });
  // The projects' hint is a "?" beside the legend and stays the group's description.
  await expectFieldHelp(page, {
    button: group.getByRole("button", { name: "Help: Projects" }),
    text: "Every watched project is picked; clear the ones that should not get it.",
    describes: group,
  });
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

async function receivedFires(request: import("@playwright/test").APIRequestContext, triggerId: string) {
  const answer = await request.get(`http://127.0.0.1:${String(FAKE_FORGE_PORT)}/__fires/${triggerId}`);
  return (await answer.json()) as { status: number }[];
}

/** Adds a wake routine to a project through its Routines tab, so a Retry of the fire has something to fire. */
async function addRoutine(page: Page, fullName: string, trigger: string) {
  await page.goto(`/projects/${fullName}?tab=routines`);
  const openAdd = page.getByRole("region", { name: "Routines" }).getByRole("button", { name: "Add routine" });
  await waitForHydration(openAdd);
  await openAdd.click();
  const dialog = page.getByRole("dialog", { name: "Add a routine" });
  await dialog.getByLabel("Name", { exact: true }).fill("Coordinator");
  await dialog.getByLabel("Trigger id or fire URL", { exact: true }).fill(trigger);
  await dialog.getByLabel("Token", { exact: true }).fill(E2E_ROUTINE_TOKEN);
  await dialog.getByRole("button", { name: "Add routine" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("[data-routines]").getByRole("listitem")).toHaveCount(1);
}

/** The card that lists the projects, for the evidence photographs (an open menu shows within its box). */
const projectsCard = (page: Page) => page.getByRole("list", { name: "Projects this broadcast went to" }).locator("xpath=..");
/** The Issue link, the row's one inline control on a sent project. */
const issueLink = (actions: Locator) => actions.getByRole("link", { name: "Issue #1" });
/** The Retry send button, the row's one inline control on a failed project. */
const retrySend = (name: string) => (actions: Locator) => actions.getByRole("button", { name: `Retry ${name}` });

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
  const detailPath = new URL(page.url()).pathname;
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(TITLE);
  for (const name of ["example-org/herald-app", "example-org/herald-web"]) {
    const row = projectRow(page, name);
    await expect(row).toContainText("Sent");
    // No routine yet, so the fire can be retried: the Issue link stays inline and the fire's Retry is in the menu (CT-23).
    await expect(row.locator("[data-fire]")).toHaveAttribute("data-fire", "no_routine");
    const issue = row.getByRole("link", { name: "Issue #1" });
    await expect(issue).toHaveAttribute("href", `http://127.0.0.1:${String(FAKE_FORGE_PORT)}/${name}/issues/1`);
    await expect(issue).toHaveAttribute("target", "_blank");
    await expect(issue).toHaveAttribute("rel", "noreferrer");
    await expect(row.getByRole("button", { name: /^Retry/ })).toHaveCount(0);
    await expectSendRowLayout(page, row, { inline: issueLink, hasMenu: true });
  }
  await expect(projectRow(page, "example-org/herald-docs")).toContainText("Failed");
  await expect(projectRow(page, "example-org/herald-docs")).toContainText("The project has no cockpit label.");
  // A failed project has one control, its Retry, inline and with no menu.
  await expectSendRowLayout(page, projectRow(page, "example-org/herald-docs"), { inline: retrySend("example-org/herald-docs"), hasMenu: false });

  await captureEvidence(page, { name: "01-projects", target: (current) => projectsCard(current) });
  await captureEvidence(page, {
    name: "02-menu-open",
    // The whole page, since an open menu can reach past the card.
    target: (current) => current.locator("main"),
    prepare: async (current) => {
      await projectRow(current, "example-org/herald-web").getByRole("button", { name: "More actions for example-org/herald-web" }).click();
      await expect(current.getByRole("menu")).toBeVisible();
    },
  });

  // The menu opens by keyboard on its first item and closes on Escape, giving focus back to its button.
  const webMenu = projectRow(page, "example-org/herald-web").getByRole("button", { name: "More actions for example-org/herald-web" });
  await waitForHydration(webMenu);
  await webMenu.focus();
  await page.keyboard.press("Enter");
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem")).toHaveText(["Retry the fire"]);
  await expect(menu.getByRole("menuitem", { name: "Retry the fire" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(webMenu).toBeFocused();

  // A retry of the failed project fails again with the same reason and creates nothing.
  await projectRow(page, "example-org/herald-docs").getByRole("button", { name: "Retry example-org/herald-docs" }).click();
  await expect(projectRow(page, "example-org/herald-docs")).toContainText("Failed");

  // Once the project has a routine, Retry the fire from the menu fires it for the same issue; nothing is left to retry.
  await addRoutine(page, "example-org/herald-app", APP_TRIGGER);
  await page.goto(detailPath);
  const appRow = projectRow(page, "example-org/herald-app");
  const appMenu = appRow.getByRole("button", { name: "More actions for example-org/herald-app" });
  await waitForHydration(appMenu);
  await appMenu.click();
  await page.getByRole("menu").getByRole("menuitem", { name: "Retry the fire" }).click();
  await expect(appRow.locator("[data-fire]")).toHaveAttribute("data-fire", "sent");
  await expect(appRow.locator("[data-fire]")).toHaveCount(1);
  expect((await receivedFires(request, APP_TRIGGER)).map((fire) => fire.status)).toEqual([200]);
  await expectSendRowLayout(page, appRow, { inline: issueLink, hasMenu: false });
  // The other project keeps its own menu.
  await expect(projectRow(page, "example-org/herald-web").locator("[data-row-actions-menu]")).toHaveCount(1);

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
  // The row is one box: its title's link is stretched over the whole list item, which lights on hover (CT-18).
  const sent = page.getByRole("list", { name: "Sent broadcasts, newest first" }).getByRole("listitem").filter({ hasText: TITLE });
  await expect(sent.getByRole("link", { name: TITLE })).toHaveAttribute("data-row-link", "");
  await sent.hover();
  await expect(sent).not.toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
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

  // The trash can sits inside the row's box (the list item that lights on hover), in the right column after the arrow.
  const trash = row.getByRole("button", { name: "Delete Run the doctor" });
  const rowBox = await row.boundingBox();
  const trashBox = await trash.boundingBox();
  const arrowBox = await row.locator("[data-row-side] svg.lucide-arrow-right").boundingBox();
  expect(rowBox && trashBox && arrowBox).toBeTruthy();
  if (rowBox && trashBox && arrowBox) {
    expect(trashBox.x).toBeGreaterThanOrEqual(rowBox.x);
    expect(trashBox.x + trashBox.width).toBeLessThanOrEqual(rowBox.x + rowBox.width);
    expect(trashBox.y).toBeGreaterThanOrEqual(rowBox.y);
    expect(trashBox.y + trashBox.height).toBeLessThanOrEqual(rowBox.y + rowBox.height);
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
    // The row menu opens by a tap, inside the screen, its item touch-sized; Retry the fire runs from it.
    const menuButton = page.getByRole("button", { name: "More actions for example-org/herald-web" });
    await expectTouchTarget(menuButton);
    await waitForHydration(menuButton);
    await menuButton.tap();
    const item = page.getByRole("menu").getByRole("menuitem", { name: "Retry the fire" });
    await expectTouchTarget(item);
    const itemBox = await item.boundingBox();
    expect(itemBox).not.toBeNull();
    if (itemBox !== null) {
      expect(itemBox.x).toBeGreaterThanOrEqual(0);
      expect(itemBox.x + itemBox.width).toBeLessThanOrEqual(390);
    }
    expect(await overflow()).toBeLessThanOrEqual(0);
    await item.tap();
    await expect(page.getByRole("menu")).toHaveCount(0);
    // Still no routine in that project, so the fire stays retryable and the row keeps its menu.
    await expect(page.locator("[data-send-menu][aria-busy=false]").first()).toBeAttached();
    await expect(projectRow(page, "example-org/herald-web").locator("[data-fire]")).toHaveAttribute("data-fire", "no_routine");
    await expect(projectRow(page, "example-org/herald-web").locator("[data-row-actions-menu]")).toHaveCount(1);
    expect(await overflow()).toBeLessThanOrEqual(0);
  });
});
