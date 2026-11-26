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
// newest first, Run now and Delete in a row's menu, a done row opening its broadcast, the empty state. Then the task
// dialog (CT-38): New task creates a task, a refused save keeps the values and names the field, Edit moves the time,
// Cancel and Escape save nothing. Then repetition (CT-39): a weekly task stays in Scheduled after Run now with its next
// time, its run lands in Done, and Pause and Resume switch its badge. Only this spec has scheduled tasks (seeded by e2e/prepare.ts) and watches their
// projects, so it runs in order on its own rows.
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

async function openMenu(page: Page, title: string, pause: "Pause" | "Resume" = "Pause"): Promise<Locator> {
  const button = row(scheduledList(page), title).getByRole("button", { name: `More actions: ${title}` });
  await waitForHydration(button);
  await button.click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem")).toHaveText(["Edit", "Run now", pause, "Delete"]);
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

// The task dialog (CT-38). The fixture projects are watched by the Run now test above.
const [ALMANAC_APP, ALMANAC_WEB] = SCHEDULED_REPOSITORIES;

function taskDialog(page: Page, name: "New task" | "Edit task"): Locator {
  return page.getByRole("dialog", { name });
}

async function openNewTask(page: Page): Promise<Locator> {
  const button = page.getByRole("button", { name: "New task" });
  await waitForHydration(button);
  await button.click();
  const dialog = taskDialog(page, "New task");
  await expect(dialog).toBeVisible();
  return dialog;
}

async function fillTask(dialog: Locator, task: { readonly title: string; readonly prompt: string }) {
  await dialog.getByRole("textbox", { name: "Title" }).fill(task.title);
  await dialog.getByRole("textbox", { name: "Prompt" }).fill(task.prompt);
  await dialog.getByRole("button", { name: "Tomorrow 08:00" }).click();
  await dialog.getByRole("checkbox", { name: ALMANAC_APP, exact: true }).click();
  await dialog.getByRole("checkbox", { name: ALMANAC_WEB, exact: true }).click();
}

/** Yesterday's date in the browser's zone: always in the past whatever the app's zone. */
function yesterday(): string {
  return new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

test("New task opens an empty dialog starting tomorrow 08:00, and Schedule adds the task, at 1280 and 390 px", async ({ page }) => {
  await signIn(page, "/scheduled");
  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    const title = `Almanac quality check ${String(size.width)}`;
    const dialog = await openNewTask(page);
    await expect(dialog.getByRole("textbox", { name: "Title" })).toHaveValue("");
    await expect(dialog.getByLabel("Time", { exact: true })).toHaveValue("08:00");
    await expect(dialog.locator("[data-run-hint]")).toContainText(/^Europe\/Warsaw · (in \d+ hours?|tomorrow)$/);
    await expect(dialog.getByText(/^Selected: 0 of \d+$/)).toBeVisible();
    if (size.width < MOBILE_BREAKPOINT_PX) {
      await expectTouchTarget(dialog.getByRole("button", { name: "Schedule" }));
      await expectTouchTarget(dialog.getByRole("button", { name: "Monday 08:00" }));
      // Primary first on a phone, both full width.
      const schedule = await dialog.getByRole("button", { name: "Schedule" }).boundingBox();
      const cancel = await dialog.locator("[data-slot=dialog-footer]").getByRole("button", { name: "Cancel" }).boundingBox();
      expect((schedule?.y ?? 0) < (cancel?.y ?? 0)).toBe(true);
      expect(Math.round(schedule?.width ?? 0)).toBe(Math.round(cancel?.width ?? -1));
    }
    await fillTask(dialog, { title, prompt: "Check the code quality.\nFile what you find." });
    await expect(dialog.getByText(/^Selected: 2 of \d+$/)).toBeVisible();
    // However long the project list, the dialog's own scroll ends at its footer: nothing blank below it.
    const footer = dialog.locator("[data-slot=dialog-footer]");
    await dialog.evaluate((element) => element.scrollTo(0, element.scrollHeight));
    await expect.poll(async () => {
      const [box, footerBox] = [await dialog.boundingBox(), await footer.boundingBox()];
      return Math.round((box?.y ?? 0) + (box?.height ?? 0) - (footerBox?.y ?? 0) - (footerBox?.height ?? 0));
    }).toBeLessThanOrEqual(1);
    await dialog.getByRole("button", { name: "Schedule" }).click();
    await expect(dialog).toHaveCount(0);
    const created = row(scheduledList(page), title);
    await expect(created).toContainText("2 projects · Check the code quality.");
    await expect(created.locator("[data-planned-time]")).toContainText("8:00");
  }
  // The page scrolls nowhere sideways on a phone with the dialog open.
  await page.setViewportSize({ width: 390, height: 844 });
  await openNewTask(page);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
  await page.keyboard.press("Escape");

  await page.setViewportSize({ width: 1280, height: 900 });
  await captureEvidence(page, {
    name: "01-new-empty",
    target: (current) => current.locator("body"),
    prepare: async (current) => {
      await openNewTask(current);
    },
  });
  await captureEvidence(page, {
    name: "02-new-filled",
    target: (current) => current.locator("body"),
    prepare: async (current) => {
      await fillTask(await openNewTask(current), { title: "Weekly code quality check", prompt: "Check the code quality and file what you find." });
    },
  });
});

test("a refused save keeps the values and shows the error under its field", async ({ page }) => {
  await signIn(page, "/scheduled");
  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    const before = await titles(scheduledList(page));
    const dialog = await openNewTask(page);
    await dialog.getByRole("textbox", { name: "Title" }).fill("Almanac too early");
    await dialog.getByLabel("Date", { exact: true }).fill(yesterday());
    await dialog.getByRole("checkbox", { name: ALMANAC_APP, exact: true }).click();
    await dialog.getByRole("button", { name: "Schedule" }).click();

    const prompt = dialog.getByRole("textbox", { name: "Prompt" });
    await expect(prompt).toHaveAttribute("aria-invalid", "true");
    await expect(prompt).toHaveAccessibleDescription("Write the prompt.");
    await expect(dialog.getByRole("textbox", { name: "Title" })).toHaveValue("Almanac too early");

    await prompt.fill("Too early on purpose.");
    await dialog.getByRole("button", { name: "Schedule" }).click();
    const date = dialog.getByLabel("Date", { exact: true });
    await expect(date).toHaveAttribute("aria-invalid", "true");
    await expect(dialog.getByText("This time has already passed. Pick a time in the future.")).toBeVisible();
    await expect(prompt).not.toHaveAttribute("aria-invalid", "true");
    await expect(prompt).toHaveValue("Too early on purpose.");
    await expect(date).toHaveValue(yesterday());
    await expect(dialog.getByRole("checkbox", { name: ALMANAC_APP, exact: true })).toBeChecked();

    await dialog.locator("[data-slot=dialog-footer]").getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toHaveCount(0);
    await expect(titles(scheduledList(page))).resolves.toEqual(before);
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  await captureEvidence(page, {
    name: "03-errors",
    target: (current) => current.locator("body"),
    prepare: async (current) => {
      const dialog = await openNewTask(current);
      await dialog.getByRole("textbox", { name: "Title" }).fill("Almanac too early");
      await dialog.getByRole("textbox", { name: "Prompt" }).fill("Too early on purpose.");
      await dialog.getByLabel("Date", { exact: true }).fill(yesterday());
      await dialog.getByRole("checkbox", { name: ALMANAC_APP, exact: true }).click();
      await dialog.getByRole("button", { name: "Schedule" }).click();
      await expect(dialog.getByText("This time has already passed. Pick a time in the future.")).toBeVisible();
    },
  });
});

test("Edit opens the task's values, a new time moves the row, and Escape saves nothing", async ({ page }) => {
  await signIn(page, "/scheduled");
  const title = "Almanac quality check 1280";
  await (await openMenu(page, title)).getByRole("menuitem", { name: "Edit" }).click();
  const dialog = taskDialog(page, "Edit task");
  await expect(dialog.getByRole("textbox", { name: "Title" })).toHaveValue(title);
  await expect(dialog.getByRole("textbox", { name: "Prompt" })).toHaveValue("Check the code quality.\nFile what you find.");
  await expect(dialog.getByLabel("Time", { exact: true })).toHaveValue("08:00");
  await expect(dialog.getByRole("checkbox", { name: ALMANAC_APP, exact: true })).toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: ALMANAC_WEB, exact: true })).toBeChecked();

  // Escape closes without saving and gives focus back to the row's menu button.
  await dialog.getByLabel("Time", { exact: true }).fill("09:30");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(row(scheduledList(page), title).getByRole("button", { name: `More actions: ${title}` })).toBeFocused();
  await expect(row(scheduledList(page), title).locator("[data-planned-time]")).toContainText("8:00");

  await (await openMenu(page, title)).getByRole("menuitem", { name: "Edit" }).click();
  await expect(dialog.getByLabel("Time", { exact: true })).toHaveValue("08:00");
  await dialog.getByLabel("Time", { exact: true }).fill("09:30");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(row(scheduledList(page), title).locator("[data-planned-time]")).toContainText("9:30");

  await captureEvidence(page, {
    name: "04-edit",
    target: (current) => current.locator("body"),
    prepare: async (current) => {
      await (await openMenu(current, title)).getByRole("menuitem", { name: "Edit" }).click();
      await expect(taskDialog(current, "Edit task")).toBeVisible();
    },
  });
});

// Repetition (CT-39). The fixture projects are watched by the Run now test above.
test("a weekly task stays in Scheduled after Run now with its next time, its run shows in Done, and it pauses and resumes, at 1280 and 390 px", async ({ page }) => {
  await signIn(page, "/scheduled");
  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    const title = `Almanac weekly check ${String(size.width)}`;
    const dialog = await openNewTask(page);
    await fillTask(dialog, { title, prompt: "Check the code quality every week." });
    const choice = dialog.getByRole("radiogroup", { name: "Repeat" });
    const weekday = await dialog.getByLabel("Date", { exact: true }).inputValue().then((day) =>
      new Intl.DateTimeFormat("en", { weekday: "long", timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`)),
    );
    await expect(choice.getByRole("radio")).toHaveCount(3);
    await expect(choice.getByRole("radio", { name: "No" })).toBeChecked();
    if (size.width < MOBILE_BREAKPOINT_PX) {
      await expectTouchTarget(choice.locator("div").filter({ has: page.getByRole("radio", { name: "Daily" }) }));
    }
    // One row: "No" and "Daily" always share their top edge; the weekday's choice joins them unless it does not fit.
    const tops = await choice.getByRole("radio").evaluateAll((radios) => radios.map((radio) => Math.round(radio.getBoundingClientRect().top)));
    expect(tops[0]).toBe(tops[1]);
    if (size.width >= MOBILE_BREAKPOINT_PX) {
      expect(new Set(tops).size).toBe(1);
    }
    await choice.getByText(`Weekly on ${weekday}`, { exact: true }).click();
    await expect(choice.getByRole("radio", { name: `Weekly on ${weekday}` })).toBeChecked();
    await dialog.getByRole("button", { name: "Schedule" }).click();
    await expect(dialog).toHaveCount(0);

    const created = row(scheduledList(page), title);
    await expect(created).toContainText("2 projects · weekly · Check the code quality every week.");
    // The date and time, without the "in 17 hours" that moves while the test runs.
    const planned = (await created.locator("[data-planned-time]").innerText()).split(" · ")[0] ?? "";
    await expect(created.locator("[data-planned-time]")).toContainText("8:00");

    const doneLink = page.getByRole("link", { name: /^Done\s*\d+$/ });
    const doneBefore = Number((await doneLink.innerText()).replace(/\D/g, ""));
    await (await openMenu(page, title)).getByRole("menuitem", { name: "Run now" }).click();
    await expect(page.getByRole("link", { name: new RegExp(`^Done\\s*${String(doneBefore + 1)}$`) })).toBeVisible();
    await expect(row(scheduledList(page), title)).toHaveCount(1);
    await expect(row(scheduledList(page), title).locator("[data-planned-time]")).toContainText(planned);

    await (await openMenu(page, title)).getByRole("menuitem", { name: "Pause" }).click();
    await expect(row(scheduledList(page), title).locator("[data-paused]")).toHaveText("Paused");
    await expect(row(scheduledList(page), title).locator("[data-planned-time]")).toHaveCount(0);
    await (await openMenu(page, title, "Resume")).getByRole("menuitem", { name: "Resume" }).click();
    await expect(row(scheduledList(page), title).locator("[data-planned-time]")).toContainText(planned);

    await page.getByRole("link", { name: /^Done\s*\d+$/ }).click();
    const done = row(doneList(page), title);
    await expect(done).toHaveCount(1);
    await expectResultBadge(page, done, { attribute: ["data-run-result", "sent"], tone: "success", word: "Sent 2 of 2" });
    await page.getByRole("link", { name: /^Scheduled\s*\d+$/ }).click();
    await expect(page).toHaveURL(/\/scheduled\?tab=scheduled$/);
  }

  await page.setViewportSize({ width: 1280, height: 900 });
  const weekly = "Almanac weekly check 1280";
  const paused = "Almanac weekly check 390";
  await (await openMenu(page, paused)).getByRole("menuitem", { name: "Pause" }).click();
  await expect(row(scheduledList(page), paused).locator("[data-paused]")).toHaveText("Paused");
  await expectListEntryRows(page, scheduledList(page), "06-repeating");
  await expectSideHoldsStateAndControls(page, row(scheduledList(page), weekly));
  await expectSideHoldsStateAndControls(page, row(scheduledList(page), paused));
  await captureEvidence(page, { name: "05-repeating-and-paused-rows", target: (current) => scheduledList(current) });
  await captureEvidence(page, {
    name: "06-dialog-repeat",
    target: (current) => current.locator("body"),
    prepare: async (current) => {
      await (await openMenu(current, weekly)).getByRole("menuitem", { name: "Edit" }).click();
      const weeklyChoice = taskDialog(current, "Edit task").getByRole("radio", { name: /^Weekly on / });
      await expect(weeklyChoice).toBeChecked();
      // Above the sticky footer on a phone.
      await weeklyChoice.evaluate((element) => element.scrollIntoView({ block: "center" }));
    },
  });
});
