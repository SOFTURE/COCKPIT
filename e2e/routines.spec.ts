import type { APIRequestContext, Locator, Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { E2E_FLAKY_TRIGGER, E2E_ROUTINE_TOKEN, FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { captureEvidence } from "./capture-evidence.ts";
import { expectStateInRightColumn } from "./expect-row-state.ts";
import { expectRoutineRowLayout } from "./expect-routine-row.ts";
import { submitRepository } from "./submit-repository.ts";
import { waitForHydration } from "./wait-for-hydration.ts";
import { expectListEntryRows } from "./expect-list-entry-rows.ts";

// CT-10: COCKPIT fires a project's routines right after it opens a cockpit issue there, against the fake routines API.
// Shares the database with the other specs: it watches repositories no other spec uses, and sends only to them.
test.describe.configure({ mode: "serial" });

const APP = "example-org/signal-app";
const WEB = "example-org/signal-web";
const TOOLS = "example-org/signal-tools";
const APP_TRIGGER = "trig_e2e_signal_app";
const TITLE = "Wake the coordinators";

interface ReceivedFire {
  readonly text: string;
  readonly status: number;
  readonly hasHeaders: boolean;
}

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

async function receivedFires(request: APIRequestContext, triggerId: string): Promise<ReceivedFire[]> {
  const answer = await request.get(`http://127.0.0.1:${String(FAKE_FORGE_PORT)}/__fires/${triggerId}`);
  return (await answer.json()) as ReceivedFire[];
}

async function addRoutine(page: Page, fullName: string, trigger: string) {
  await page.goto(`/projects/${fullName}?tab=routines`);
  // The card header's button opens the form in a dialog, which closes once the routine is saved.
  const openAdd = page.getByRole("region", { name: "Routines" }).getByRole("button", { name: "Add routine" });
  await waitForHydration(openAdd);
  await openAdd.click();
  const dialog = page.getByRole("dialog", { name: "Add a routine" });
  // The provider comes first and decides the fields below it; Claude Code is the one provider today.
  await expect(dialog.getByRole("combobox", { name: "Provider" })).toHaveText("Claude Code");
  // The dialog opens on its first field, not on the "?" before it, so no tooltip opens by itself.
  await expect(dialog.getByRole("combobox", { name: "Provider" })).toBeFocused();
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(dialog.getByRole("combobox", { name: "Kind" })).toHaveText("Wake on a new cockpit issue");
  await dialog.getByLabel("Name", { exact: true }).fill("Coordinator");
  await dialog.getByLabel("Trigger id or fire URL", { exact: true }).fill(trigger);
  await dialog.getByLabel("Token", { exact: true }).fill(E2E_ROUTINE_TOKEN);
  await dialog.getByRole("button", { name: "Add routine" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.locator("[data-routines]").getByRole("listitem")).toHaveCount(1);
  // A new routine starts enabled.
  await expect(page.locator("[data-routines]").getByRole("switch", { name: "Routine Coordinator enabled" })).toBeChecked();
}

/** The row's "More actions" menu, opened by a click; its items in order. */
async function openRowMenu(page: Page, row: Locator) {
  await row.getByRole("button", { name: "More actions for Coordinator" }).click();
  const menu = page.getByRole("menu");
  await expect(menu.getByRole("menuitem")).toHaveText(["Test", "Replace token", "Delete"]);
  return menu;
}

function routinesCard(page: Page) {
  return page.getByRole("region", { name: "Routines" });
}

function projectRow(page: Page, fullName: string) {
  return page.getByRole("list", { name: "Projects this broadcast went to" }).getByRole("listitem").filter({ hasText: fullName });
}

// One flow in three serial steps, each within the default test budget even under the CI's four-worker load: as one
// test it took 12 s alone and ran past 30 s under load (master run 45782514173).
let broadcastPath = "";

test("a routine is added and its Test fires the test text", async ({ page, request }) => {
  await signIn(page, "/settings");
  for (const name of [APP, WEB]) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }

  // The fire URL is accepted and its trigger id kept; the token shows only by its last four characters.
  await addRoutine(page, APP, `https://api.anthropic.com/v1/claude_code/routines/${APP_TRIGGER}/fire`);
  const routine = page.locator("[data-routines]").getByRole("listitem");
  await expect(routine).toContainText(APP_TRIGGER);
  await expect(routine.locator("[data-routine-provider]")).toHaveText("Claude Code");
  await expect(routine).toContainText(`token ••••${E2E_ROUTINE_TOKEN.slice(-4)}`);
  await expect(routine.locator("[data-last-call-badge]")).toHaveAttribute("data-last-call-badge", "never");
  await expect(routine.locator("[data-last-call-badge]")).toHaveText("Never called");
  expect(await page.content()).not.toContain(E2E_ROUTINE_TOKEN);

  // Test, from the row menu, fires the test text; the result is announced and the badge shows it with its time.
  await (await openRowMenu(page, routine)).getByRole("menuitem", { name: "Test" }).click();
  await expect(routine.getByRole("status").filter({ hasText: "Test fired" })).toHaveText("Test fired: HTTP 200");
  await expect(routine.locator("[data-last-call-badge]")).toHaveAttribute("data-last-call-badge", "ok");
  await expect(routine.locator("[data-last-call-badge]")).toHaveText(/^Last call succeeded: HTTP 200 · \S/);
  await expectStateInRightColumn(page, routine, "HTTP 200");
  await expectRoutineRowLayout(page, routine);
  const tested = await receivedFires(request, APP_TRIGGER);
  expect(tested).toEqual([{ text: "COCKPIT test: reply in this chat that the test arrived; change nothing.", status: 200, hasHeaders: true }]);
});

test("a broadcast fires each project's routine once and shows a failed fire", async ({ page, request }) => {
  await signIn(page, "/settings");
  await addRoutine(page, WEB, E2E_FLAKY_TRIGGER);

  // A broadcast to both projects opens one issue each and fires each project's routine once.
  // The form's fields are controlled: text typed before the page hydrates is reset by it, and the empty required
  // Title then blocks the submit. "Clear all" changes the count only once the page is interactive.
  await page.goto("/broadcast");
  const group = page.getByRole("group", { name: "Projects" });
  await group.getByRole("button", { name: "Clear all" }).click();
  await expect(group.getByText(/^\d+ of \d+ picked$/)).toHaveText(/^0 of \d+ picked$/);
  await page.getByLabel("Title").fill(TITLE);
  await page.getByLabel("Message").fill("Run the doctor and report what it finds.");
  for (const name of [APP, WEB]) {
    await group.getByRole("checkbox", { name, exact: true }).click();
  }
  await expect(group.getByText(/^\d+ of \d+ picked$/)).toHaveText(/^2 of \d+ picked$/);
  await expect(page.getByLabel("Title")).toHaveValue(TITLE);
  await page.getByRole("button", { name: "Send broadcast" }).click();
  await expect(page).toHaveURL(/\/broadcast\/[0-9a-f-]{36}$/);

  await expect(projectRow(page, APP).locator("[data-fire]")).toHaveAttribute("data-fire", "sent");
  // The fire reads only its state, on the line with "Sent"; the routine's name is in the tooltip (CT-13).
  const appLine = projectRow(page, APP).locator("[data-send-line]");
  await expect(appLine).toContainText("Sent");
  await expect(appLine.locator("[data-fire]")).toHaveText("Routine fired");
  await expect(appLine.locator('[data-fire] [title="Coordinator: Routine fired"]')).toHaveCount(1);
  await expectStateInRightColumn(page, projectRow(page, APP), "Routine fired");
  await expect(projectRow(page, WEB).locator("[data-fire]")).toHaveAttribute("data-fire", "failed");
  const webLine = projectRow(page, WEB).locator("[data-send-line]");
  await expect(webLine).toContainText("Sent");
  await expect(webLine.locator("[data-fire]")).toHaveText("Fire failed · HTTP 503 · API error");

  const appFires = await receivedFires(request, APP_TRIGGER);
  expect(appFires).toHaveLength(2);
  expect(appFires[1]).toEqual({
    text: `COCKPIT command: https://github.com/${APP}/issues/1`,
    status: 200,
    hasHeaders: true,
  });
  expect((await receivedFires(request, E2E_FLAKY_TRIGGER)).map((fire) => fire.status)).toEqual([503]);
  broadcastPath = new URL(page.url()).pathname;
});

test("Retry recovers the failed fire and the Routines tab shows it", async ({ page, request }) => {
  expect(broadcastPath).toMatch(/^\/broadcast\/[0-9a-f-]{36}$/);
  await signIn(page, broadcastPath);

  // Retry fires the failed one again for the same issue; the sent one is left alone.
  // The Issue link stays inline; the fire's Retry is in the row menu (CT-23).
  const webMenu = projectRow(page, WEB).getByRole("button", { name: `More actions for ${WEB}` });
  await waitForHydration(webMenu);
  await webMenu.click();
  await page.getByRole("menu").getByRole("menuitem", { name: "Retry the fire" }).click();
  await expect(projectRow(page, WEB).locator("[data-fire]")).toHaveAttribute("data-fire", "sent");
  await expect(projectRow(page, WEB).locator("[data-row-actions-menu]")).toHaveCount(0);
  const webFires = await receivedFires(request, E2E_FLAKY_TRIGGER);
  expect(webFires.map((fire) => fire.status)).toEqual([503, 200]);
  expect(webFires[1]?.text).toBe(`COCKPIT command: https://github.com/${WEB}/issues/1`);
  expect(await receivedFires(request, APP_TRIGGER)).toHaveLength(2);

  // The project's Routines tab shows the last call and the issue's fire.
  await page.goto(`/projects/${WEB}?tab=routines`);
  const webRoutine = page.locator("[data-routines]").getByRole("listitem");
  await expect(webRoutine.locator("[data-last-call-badge]")).toContainText("HTTP 200 · ");
  // One row per issue: its number, title and fire time on the left, a green Fired badge on the right (CT-15).
  const firedRow = page.locator("[data-fired-issues]").getByRole("listitem");
  await expect(firedRow).toHaveCount(1);
  await expect(firedRow.getByRole("link")).toHaveText(`#1 COCKPIT command: ${TITLE}`);
  await expect(firedRow.locator("[data-fired-at]")).toHaveText(/^fired \S/);
  await expect(firedRow.locator("[data-fired-badge]")).toHaveAttribute("data-fired-badge", "fired");
  await expect(firedRow.locator("[data-fired-badge]")).toHaveText("Fired");
  await expectStateInRightColumn(page, firedRow, "Fired");
  await expectListEntryRows(page, page.locator("[data-routines]"), "21-routines");
  await expectListEntryRows(page, page.locator("[data-fired-issues]"), "22-fired-issues");
  await expect(firedRow.getByRole("button", { name: /^Retry waking/ })).toHaveCount(0);
});

test("a routine is managed from its row menu at 1280 and 390 px: keyboard, Test, a new token, the switch and a confirmed delete", async ({ page }) => {
  await signIn(page, "/settings");
  await submitRepository(page, TOOLS);
  await expect(page.getByRole("status").first()).toContainText(`${TOOLS} is now watched.`);

  // A field's hint is a "?" tooltip by its label.
  await page.goto(`/projects/${TOOLS}?tab=routines`);
  const openAdd = page.getByRole("region", { name: "Routines" }).getByRole("button", { name: "Add routine" });
  await waitForHydration(openAdd);
  await openAdd.click();
  const dialog = page.getByRole("dialog", { name: "Add a routine" });
  await dialog.getByRole("combobox", { name: "Provider" }).click();
  await expect(page.getByRole("option")).toHaveText(["Claude Code"]);
  await page.getByRole("option", { name: "Claude Code" }).click();
  await expect(dialog.getByLabel("Trigger id or fire URL", { exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Help: Token" }).click();
  await expect(page.getByRole("tooltip")).toContainText("only its last four characters show");
  await page.keyboard.press("Escape");

  await addRoutine(page, TOOLS, "trig_e2e_signal_tools");
  const routine = page.locator("[data-routines]").getByRole("listitem");
  await expectRoutineRowLayout(page, routine);
  await captureEvidence(page, { name: "01-row-new", target: routinesCard });
  const menuButton = routine.getByRole("button", { name: "More actions for Coordinator" });
  const menu = page.getByRole("menu");
  const enabledSwitch = routine.getByRole("switch", { name: "Routine Coordinator enabled" });
  const confirm = page.getByRole("alertdialog", { name: "Delete the routine Coordinator?" });

  for (const size of [{ width: 1280, height: 900 }, { width: 390, height: 844 }]) {
    await page.setViewportSize(size);

    // The menu opens from the keyboard on its first item; the arrows move through Test, Replace token and Delete
    // (last, after a separator, in the danger tone); Escape closes it and gives focus back to its button.
    await menuButton.focus();
    await page.keyboard.press("Enter");
    await expect(menu.getByRole("menuitem")).toHaveText(["Test", "Replace token", "Delete"]);
    await expect(menu.getByRole("menuitem", { name: "Test" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem", { name: "Replace token" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem", { name: "Delete" })).toBeFocused();
    await expect(menu.getByRole("separator")).toHaveCount(1);
    expect(await menu.locator("[data-row-action]").evaluateAll((items) => items.map((item) => item.getAttribute("data-row-action")))).toEqual(["test", "replace-token", "delete"]);
    await expect(menu.getByRole("menuitem", { name: "Delete" })).toHaveAttribute("data-variant", "destructive");
    await page.keyboard.press("Escape");
    await expect(menu).toHaveCount(0);
    await expect(menuButton).toBeFocused();

    // Test from the menu: the badge turns from its last state to a green HTTP 200 with the call's time.
    await (await openRowMenu(page, routine)).getByRole("menuitem", { name: "Test" }).click();
    await expect(menu).toHaveCount(0);
    await expect(routine.locator("[data-last-call-badge]")).toHaveAttribute("data-last-call-badge", "ok");
    await expect(routine.locator("[data-last-call-badge]")).toHaveText(/^Last call succeeded: HTTP 200 · \S/);
    await expect(routine.getByRole("status").filter({ hasText: "Test fired" })).toHaveText("Test fired: HTTP 200");
    // While a Test runs its item waits disabled; the next one can start once the row is no longer busy.
    await expect(routine.locator("[data-routine-controls]")).toHaveAttribute("aria-busy", "false");

    // Replace token, chosen with the keyboard, opens its dialog on the token field; saved, it closes and focus is back
    // on the menu's button.
    // Each key waits for the focus it moves, as a person sees the menu before pressing the next one.
    await menuButton.focus();
    await page.keyboard.press("Enter");
    await expect(menu.getByRole("menuitem", { name: "Test" })).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await expect(menu.getByRole("menuitem", { name: "Replace token" })).toBeFocused();
    await page.keyboard.press("Enter");
    const replace = page.getByRole("dialog", { name: "Replace the token of Coordinator" });
    await expect(replace.getByLabel("New token", { exact: true })).toBeFocused();
    await replace.getByLabel("New token", { exact: true }).fill(E2E_ROUTINE_TOKEN);
    await replace.getByRole("button", { name: "Replace token" }).click();
    await expect(replace).toHaveCount(0);
    await expect(menuButton).toBeFocused();

    // The switch turns the routine off and on again; its label is the only place that says so.
    await enabledSwitch.click();
    await expect(routine.locator("[data-slot=list-entry]")).toHaveAttribute("data-enabled", "false");
    await expect(enabledSwitch).not.toBeChecked();
    await expect(routine.locator("[data-slot=list-entry-actions]")).toContainText("Disabled");
    await expect(routine).not.toContainText("Enabled");
    if (size.width === 1280) {
      await captureEvidence(page, { name: "02-row-disabled", target: routinesCard });
    }
    await enabledSwitch.click();
    await expect(routine.locator("[data-slot=list-entry]")).toHaveAttribute("data-enabled", "true");
    await expect(enabledSwitch).toBeChecked();
    await expectRoutineRowLayout(page, routine);

    // Delete, from the menu, asks in the confirmation dialog; Cancel keeps the routine and gives focus back.
    await (await openRowMenu(page, routine)).getByRole("menuitem", { name: "Delete" }).click();
    await confirm.getByRole("button", { name: "Cancel" }).click();
    await expect(confirm).toHaveCount(0);
    await expect(routine).toHaveCount(1);
    await expect(menuButton).toBeFocused();
  }

  await captureEvidence(page, { name: "03-row-tested", target: routinesCard });
  await captureEvidence(page, {
    name: "04-row-menu-open",
    target: (shot) => shot.locator("main"),
    prepare: async () => {
      await menuButton.click();
      await expect(menu.getByRole("menuitem")).toHaveCount(3);
    },
  });
  await (await openRowMenu(page, routine)).getByRole("menuitem", { name: "Delete" }).click();
  await confirm.getByRole("button", { name: "Delete" }).click();
  await expect(page.locator("[data-routines]")).toHaveCount(0);
});
