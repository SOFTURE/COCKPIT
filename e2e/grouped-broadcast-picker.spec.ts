import { authMessages } from "@softure-ai/auth";
import type { APIRequestContext, Locator, Page } from "@playwright/test";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { captureEvidence } from "./capture-evidence.ts";
import { expectTouchTarget } from "./expect-touch-target.ts";
import { FAKE_FORGE_PORT, GROUPED_PICKER_REPOSITORIES, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { waitForHydration } from "./wait-for-hydration.ts";

// The Broadcast project picker in the owner's project groups (CT-34): one fieldset per group in name order, No group
// last, each with a checkbox that picks or clears that group only (mixed when part of it is picked); Pick all and
// Clear all still cover every group, and a send reaches only the picked projects. The database is shared: the groups
// and repositories here are used by this spec only, and no count or position of another spec's group is fixed.
test.describe.configure({ mode: "serial" });

const ROWAN = "Rowan desk";
const WILLOW = "Willow desk";
const [ROWAN_APP, ROWAN_DOCS] = GROUPED_PICKER_REPOSITORIES.rowan;
const [WILLOW_APP] = GROUPED_PICKER_REPOSITORIES.willow;
const [LOOSE_APP] = GROUPED_PICKER_REPOSITORIES.loose;
const ALL = [ROWAN_APP, ROWAN_DOCS, WILLOW_APP, LOOSE_APP];
const TITLE = "Check the code quality";

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

async function addGroup(page: Page, name: string, owner: string) {
  const form = page.getByRole("region", { name: "Project groups" }).getByRole("form", { name: "Project groups" });
  const nameField = form.getByRole("textbox", { name: "Name", exact: true });
  await waitForHydration(nameField);
  await nameField.fill(name);
  await form.getByRole("textbox", { name: "New projects from", exact: true }).fill(owner);
  await form.getByRole("button", { name: "Add" }).click();
  await expect(form.locator("[data-group-result]")).toContainText(`The group ${name} was added.`);
}

/** The "Projects" field of the Broadcast form. */
function picker(page: Page): Locator {
  return page.getByRole("group", { name: "Projects", exact: true });
}

/** One group's fieldset inside the picker, named by the group's name. */
function groupSet(page: Page, name: string): Locator {
  return picker(page).getByRole("group", { name, exact: true });
}

function groupBox(page: Page, name: string): Locator {
  return groupSet(page, name).getByRole("checkbox", { name, exact: true });
}

function projectBox(page: Page, fullName: string): Locator {
  return picker(page).getByRole("checkbox", { name: fullName, exact: true });
}

/** The group names in the picker, in document order. */
function groupNames(page: Page): Promise<string[]> {
  return picker(page)
    .locator("fieldset[data-group]")
    .evaluateAll((sets) => sets.map((set) => document.getElementById(set.getAttribute("aria-labelledby") ?? "")?.textContent ?? ""));
}

async function createdIssues(request: APIRequestContext, fullName: string) {
  const answer = await request.get(`http://127.0.0.1:${String(FAKE_FORGE_PORT)}/__issues/${fullName}`);
  return (await answer.json()) as { title: string }[];
}

async function openBroadcast(page: Page) {
  await page.goto("/broadcast");
  await waitForHydration(picker(page).getByRole("button", { name: "Pick all" }));
}

/** The picker, for the evidence photographs. */
const pickerTarget = (page: Page) => picker(page);

test("the picker shows one fieldset per group, and a group's checkbox picks or clears that group only, at 1280 px", async ({ page, request }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, "/settings");
  await addGroup(page, WILLOW, "willow-hall");
  await addGroup(page, ROWAN, "rowan-lane");
  for (const fullName of ALL) {
    await submitRepository(page, fullName);
    await expect(page.getByRole("region", { name: "Watched repositories" }).getByRole("status").first()).toContainText(`${fullName} is now watched.`);
  }

  await openBroadcast(page);
  await captureEvidence(page, { name: "01-picker-all", target: pickerTarget });

  // Groups in name order, No group last, each with its own projects under it.
  const names = await groupNames(page);
  expect(names.indexOf(ROWAN)).toBeGreaterThanOrEqual(0);
  expect(names.indexOf(ROWAN)).toBeLessThan(names.indexOf(WILLOW));
  expect(names.at(-1)).toBe("No group");
  await expect(groupSet(page, ROWAN).getByRole("listitem")).toHaveText([ROWAN_APP, ROWAN_DOCS]);
  await expect(groupSet(page, WILLOW).getByRole("listitem")).toHaveText([WILLOW_APP]);
  await expect(groupSet(page, "No group").getByRole("checkbox", { name: LOOSE_APP, exact: true })).toHaveCount(1);
  // Everything is picked at first: every group's box is checked and its count full.
  await expect(groupBox(page, ROWAN)).toHaveAttribute("aria-checked", "true");
  await expect(groupSet(page, ROWAN).locator('[data-slot="group-picked-count"]')).toHaveText("2 of 2");

  // Clearing a group clears its projects only.
  await groupBox(page, ROWAN).click();
  await expect(groupBox(page, ROWAN)).toHaveAttribute("aria-checked", "false");
  await expect(projectBox(page, ROWAN_APP)).not.toBeChecked();
  await expect(projectBox(page, ROWAN_DOCS)).not.toBeChecked();
  await expect(projectBox(page, WILLOW_APP)).toBeChecked();
  await expect(projectBox(page, LOOSE_APP)).toBeChecked();
  await expect(groupSet(page, ROWAN).locator('[data-slot="group-picked-count"]')).toHaveText("0 of 2");
  await captureEvidence(page, { name: "02-picker-group-cleared", target: pickerTarget });

  // One project of the group picked: the group's box is mixed; a click on it picks the whole group.
  await projectBox(page, ROWAN_DOCS).click();
  await expect(groupBox(page, ROWAN)).toHaveAttribute("aria-checked", "mixed");
  await expect(groupSet(page, ROWAN).locator('[data-slot="group-picked-count"]')).toHaveText("1 of 2");
  await captureEvidence(page, { name: "03-picker-group-partly", target: pickerTarget });
  await groupBox(page, ROWAN).click();
  await expect(groupBox(page, ROWAN)).toHaveAttribute("aria-checked", "true");
  await expect(projectBox(page, ROWAN_APP)).toBeChecked();

  // Clear all and Pick all cover every group, the group boxes included.
  const total = picker(page).getByText(/^\d+ of \d+ picked$/);
  await picker(page).getByRole("button", { name: "Clear all" }).click();
  await expect(total).toHaveText(/^0 of \d+ picked$/);
  for (const name of [ROWAN, WILLOW, "No group"]) {
    await expect(groupBox(page, name)).toHaveAttribute("aria-checked", "false");
  }
  await picker(page).getByRole("button", { name: "Pick all" }).click();
  await expect(total).toHaveText(/^(\d+) of \1 picked$/);
  for (const name of [ROWAN, WILLOW, "No group"]) {
    await expect(groupBox(page, name)).toHaveAttribute("aria-checked", "true");
  }

  // A send reaches only the picked projects: the Rowan group, picked through its box.
  await picker(page).getByRole("button", { name: "Clear all" }).click();
  await groupBox(page, ROWAN).click();
  await expect(total).toHaveText(/^2 of \d+ picked$/);
  await page.getByLabel("Title").fill(TITLE);
  await page.getByLabel("Message").fill("Run the code quality review and report what it finds.");
  await page.getByRole("button", { name: "Send broadcast" }).click();
  await expect(page).toHaveURL(/\/broadcast\/[0-9a-f-]{36}$/);
  for (const fullName of [ROWAN_APP, ROWAN_DOCS]) {
    await expect.poll(async () => (await createdIssues(request, fullName)).filter((issue) => issue.title === `COCKPIT command: ${TITLE}`)).toHaveLength(1);
  }
  for (const fullName of [WILLOW_APP, LOOSE_APP]) {
    expect((await createdIssues(request, fullName)).filter((issue) => issue.title === `COCKPIT command: ${TITLE}`)).toHaveLength(0);
  }
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the groups stack with 44 px rows, a group's box still picks its group, and nothing scrolls sideways", async ({ page }) => {
    await signIn(page, "/broadcast");
    await waitForHydration(groupBox(page, ROWAN));
    const names = await groupNames(page);
    expect(names.indexOf(ROWAN)).toBeLessThan(names.indexOf(WILLOW));
    expect(names.at(-1)).toBe("No group");
    await expectTouchTarget(groupSet(page, ROWAN).locator("legend > span").first());
    for (const row of await groupSet(page, ROWAN).getByRole("listitem").all()) {
      await expectTouchTarget(row);
    }

    await groupBox(page, WILLOW).tap();
    await expect(projectBox(page, WILLOW_APP)).not.toBeChecked();
    await expect(projectBox(page, ROWAN_APP)).toBeChecked();
    await groupBox(page, WILLOW).tap();
    await expect(projectBox(page, WILLOW_APP)).toBeChecked();

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
