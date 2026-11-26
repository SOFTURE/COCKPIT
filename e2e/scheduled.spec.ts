import type { Locator, Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { captureEvidence } from "./capture-evidence.ts";
import { expectListEntryRows } from "./expect-list-entry-rows.ts";
import { expectResultBadge } from "./expect-result-badge.ts";
import { expectSideHoldsStateAndControls } from "./expect-side-holds-state-and-controls.ts";
import { expectTouchTarget } from "./expect-touch-target.ts";
import { OWNER_EMAIL, OWNER_PASSWORD, SCHEDULED_REPOSITORIES, SCHEDULED_TASKS } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { waitForHydration } from "./wait-for-hydration.ts";

// The Scheduled tasks page (CT-37): the sidebar item after Broadcast, the Scheduled tab soonest first and the Done tab
// newest first, Run now and Delete in a row's menu, a done row opening its broadcast, the empty state. Only this spec
// has scheduled tasks (seeded by e2e/prepare.ts) and watches their projects, so it runs in order on its own rows.
test.describe.configure({ mode: "serial" });

const [RUN_NOW, DELETED, KEPT] = SCHEDULED_TASKS.map((task) => task.title) as [string, string, string];
const WIDTHS = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
] as const;
/** Below the theme's `md` breakpoint the sidebar is a sheet opened from the header. */
const MOBILE_BREAKPOINT_PX = 768;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

function scheduledList(page: Page): Locator {
  return page.getByRole("list", { name: "Scheduled tasks", exact: true });
}

function doneList(page: Page): Locator {
  return page.getByRole("list", { name: "Sent tasks", exact: true });
}

function titles(list: Locator): Promise<string[]> {
  return list.locator("[data-slot=list-entry-identity] [data-slot=list-entry-title]").allInnerTexts();
}

function row(list: Locator, title: string): Locator {
  return list.getByRole("listitem").filter({ hasText: title });
}

async function openMenu(page: Page, title: string): Promise<Locator> {
  const button = row(scheduledList(page), title).getByRole("button", { name: `More actions: ${title}` });
  await waitForHydration(button);
  await button.click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem")).toHaveText(["Run now", "Delete"]);
  return menu;
}

async function openSheetOnPhone(page: Page) {
  if ((page.viewportSize()?.width ?? MOBILE_BREAKPOINT_PX) >= MOBILE_BREAKPOINT_PX) {
    return;
  }
  const toggle = page.getByRole("button", { name: "Toggle sidebar" });
  await waitForHydration(toggle);
  await toggle.click();
  const sheet = page.locator('[data-mobile="true"][data-sidebar="sidebar"]');
  await expect(sheet).toBeVisible();
  await expect.poll(async () => Math.round((await sheet.boundingBox())?.x ?? -1)).toBe(0);
}

test("the sidebar item after Broadcast opens the page, marked as the current page, at 1280 and 390 px", async ({ page }) => {
  await signIn(page, "/inbox");
  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    await page.goto("/inbox");
    await openSheetOnPhone(page);
    const navigation = page.locator('[data-sidebar="sidebar"]:visible').getByRole("list", { name: "Main" });
    const labels = await navigation.getByRole("link").allInnerTexts();
    expect(labels.indexOf("Scheduled tasks")).toBe(labels.indexOf("Broadcast") + 1);
    const item = navigation.getByRole("link", { name: "Scheduled tasks" });
    if (size.width < MOBILE_BREAKPOINT_PX) {
      await expectTouchTarget(item);
    }
    await item.click();
    await expect(page).toHaveURL(/\/scheduled$/);
    // On a phone the sheet stays open over the page until it is closed.
    await expect(item).toHaveAttribute("aria-current", "page");
    if (size.width < MOBILE_BREAKPOINT_PX) {
      await page.keyboard.press("Escape");
    }
    await expect(page.getByRole("heading", { level: 1, name: "Scheduled tasks" })).toBeVisible();
  }
});

test("the Scheduled tab lists the tasks soonest first and the Done tab starts empty", async ({ page }) => {
  await signIn(page, "/scheduled");
  await expect(page.getByRole("link", { name: /^Scheduled\s*3$/ })).toHaveAttribute("aria-current", "page");
  await expect(titles(scheduledList(page))).resolves.toEqual([RUN_NOW, DELETED, KEPT]);
  const first = row(scheduledList(page), RUN_NOW);
  await expect(first).toContainText("2 projects · Run the context doctor and fix what it names.");
  await expect(first.locator("[data-planned-time]")).toContainText(/in 2 days/);
  await expectListEntryRows(page, scheduledList(page), "01-scheduled");
  await expectSideHoldsStateAndControls(page, first);
  await page.setViewportSize({ width: 390, height: 844 });
  await expectTouchTarget(first.getByRole("button", { name: `More actions: ${RUN_NOW}` }));
  await page.setViewportSize({ width: 1280, height: 900 });
  await captureEvidence(page, {
    name: "02-row-menu",
    target: (current) => current.locator("main"),
    prepare: async (current) => {
      await openMenu(current, RUN_NOW);
    },
  });

  await page.getByRole("link", { name: /^Done\s*0$/ }).click();
  await expect(page).toHaveURL(/\/scheduled\?tab=done$/);
  await expect(page.getByText("A task shows here once it has been sent.")).toBeVisible();
  await captureEvidence(page, { name: "03-done-empty", target: (current) => current.locator("main") });
});

test("Delete asks first: Cancel keeps the task, Delete removes it", async ({ page }) => {
  await signIn(page, "/scheduled");
  await captureEvidence(page, {
    name: "04-delete-dialog",
    target: (current) => current.locator("body"),
    prepare: async (current) => {
      await (await openMenu(current, DELETED)).getByRole("menuitem", { name: "Delete" }).click();
      await expect(current.getByRole("alertdialog", { name: `Delete ${DELETED}?` })).toBeVisible();
    },
  });
  await (await openMenu(page, DELETED)).getByRole("menuitem", { name: "Delete" }).click();
  const confirm = page.getByRole("alertdialog", { name: `Delete ${DELETED}?` });
  await expect(confirm).toContainText("The task will not be sent.");
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(row(scheduledList(page), DELETED)).toHaveCount(1);

  await (await openMenu(page, DELETED)).getByRole("menuitem", { name: "Delete" }).click();
  await confirm.getByRole("button", { name: "Delete" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(row(scheduledList(page), DELETED)).toHaveCount(0);
  await expect(titles(scheduledList(page))).resolves.toEqual([RUN_NOW, KEPT]);
});

test("Run now sends the task to its projects and moves it to Done, whose row opens its broadcast", async ({ page }) => {
  // The task's projects must be watched when it fires.
  await signIn(page, "/settings");
  for (const name of SCHEDULED_REPOSITORIES) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }

  await page.goto("/scheduled");
  await (await openMenu(page, RUN_NOW)).getByRole("menuitem", { name: "Run now" }).click();
  await expect(row(scheduledList(page), RUN_NOW)).toHaveCount(0);
  await expect(titles(scheduledList(page))).resolves.toEqual([KEPT]);
  await expect(page.getByRole("link", { name: /^Done\s*1$/ })).toBeVisible();

  await page.getByRole("link", { name: /^Done\s*1$/ }).click();
  const done = row(doneList(page), RUN_NOW);
  await expect(done).toContainText("2 projects · planned");
  await expectResultBadge(page, done, { attribute: ["data-run-result", "sent"], tone: "success", word: "Sent 2 of 2" });
  await expectListEntryRows(page, doneList(page), "05-done");
  await expectSideHoldsStateAndControls(page, done);

  await done.getByRole("link", { name: RUN_NOW }).click();
  await expect(page).toHaveURL(/\/broadcast\/[0-9a-f-]{36}$/);
  await expect(page.getByRole("heading", { level: 1, name: RUN_NOW })).toBeVisible();
});
