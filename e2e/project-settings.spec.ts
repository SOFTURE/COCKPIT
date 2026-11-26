import { authMessages } from "@softure-ai/auth";
import type { Locator, Page } from "@playwright/test";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { captureEvidence } from "./capture-evidence.ts";
import { expectTouchTarget } from "./expect-touch-target.ts";
import { holdScanRefresh } from "./hold-scan-refresh.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { waitForHydration } from "./wait-for-hydration.ts";

// A project's Settings tab (CT-31): the last tab, never the default, whose group select saves at once ("Saved"), moves
// the project between the owner's groups (Settings counts it), goes back to the stored group on a refusal, and is a
// touch target on a phone. The database is shared: the project and both group names are used by this spec only, and
// no count of a shared list is fixed upfront. The Projects page lists groups from CT-32 on; until then Settings'
// group counts prove the move.
test.describe.configure({ mode: "serial" });

const PROJECT = "example-org/grouping-app";
const CEDAR = "Cedar desk";
const DUNE = "Dune desk";

// The group select stays open across server writes: no scan end of another spec may reload the page under it.
test.beforeEach(async ({ page }) => {
  await holdScanRefresh(page);
});

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

function tab(page: Page, key: string): Locator {
  return page.getByRole("navigation", { name: "Sections of this project" }).locator(`[data-tab="${key}"]`);
}

function groupCard(page: Page): Locator {
  return page.getByRole("region", { name: "Group" });
}

function groupSelect(page: Page): Locator {
  return groupCard(page).getByRole("combobox", { name: "Group" });
}

function settingsGroupRow(page: Page, name: string): Locator {
  return page
    .getByRole("region", { name: "Project groups" })
    .getByRole("list", { name: "Project groups" })
    .getByRole("listitem")
    .filter({ has: page.getByText(name, { exact: true }) });
}

async function addGroup(page: Page, name: string) {
  const form = page.getByRole("region", { name: "Project groups" }).getByRole("form", { name: "Project groups" });
  const nameField = form.getByRole("textbox", { name: "Name", exact: true });
  await waitForHydration(nameField);
  await nameField.fill(name);
  await form.getByRole("button", { name: "Add" }).click();
  await expect(settingsGroupRow(page, name)).toBeVisible();
}

async function openSettingsTab(page: Page) {
  await page.goto(`/projects/${PROJECT}?tab=settings`);
  await expect(tab(page, "settings")).toHaveAttribute("aria-current", "page");
  await waitForHydration(groupSelect(page));
}

async function pickGroup(page: Page, name: string) {
  await groupSelect(page).click();
  await page.getByRole("option", { name, exact: true }).click();
}

async function expectSettingsCount(page: Page, name: string, count: string) {
  await page.goto("/settings");
  await expect(settingsGroupRow(page, name)).toContainText(count);
}

test("the Settings tab moves the project between groups and saves at once, at 1280 px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, "/settings");
  await submitRepository(page, PROJECT);
  await expect(page.getByRole("region", { name: "Watched repositories" }).getByRole("status").first()).toContainText(`${PROJECT} is now watched.`);
  await addGroup(page, CEDAR);
  await addGroup(page, DUNE);

  // The tab is last, without a counter, and never opened unasked.
  await page.goto(`/projects/${PROJECT}`);
  const tabs = page.getByRole("navigation", { name: "Sections of this project" }).locator("[data-tab]");
  await expect(tabs.last()).toHaveAttribute("data-tab", "settings");
  await expect(tabs.last()).toHaveText("Settings");
  await expect(tab(page, "waiting")).toHaveAttribute("aria-current", "page");

  await openSettingsTab(page);
  await expect(groupSelect(page)).toHaveText("No group");
  await expect(groupCard(page).getByRole("link", { name: "Manage groups" })).toHaveAttribute("href", "/settings#project-groups-heading");
  // The options: the groups in name order, then No group last.
  await groupSelect(page).click();
  const options = await page.getByRole("option").allInnerTexts();
  expect(options.indexOf(CEDAR)).toBeLessThan(options.indexOf(DUNE));
  expect(options.at(-1)).toBe("No group");
  await page.keyboard.press("Escape");
  await captureEvidence(page, { name: "01-settings-tab", target: (current) => groupCard(current) });
  await captureEvidence(page, {
    name: "02-settings-tab-open",
    target: (current) => current.locator("main"),
    prepare: async (current) => {
      await groupSelect(current).click();
      await expect(current.getByRole("option", { name: "No group" })).toBeVisible();
    },
  });

  await pickGroup(page, CEDAR);
  await expect(groupCard(page).locator("[data-settings-row-status]")).toHaveText("Saved");
  await expect(groupSelect(page)).toHaveText(CEDAR);
  await page.reload();
  await expect(groupSelect(page)).toHaveText(CEDAR);
  await expectSettingsCount(page, CEDAR, "1 project");
});

// The flow runs as serial steps that share the project and its groups, each within the default test budget under the
// CI's four-worker load: as one test it came to 33 s of the 30 s budget there (PR #152's run 45828585395).
test("moving the project back to No group empties its group, and a group deleted elsewhere is refused", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, `/projects/${PROJECT}?tab=settings`);
  await waitForHydration(groupSelect(page));
  await expect(groupSelect(page)).toHaveText(CEDAR);
  await pickGroup(page, "No group");
  await expect(groupCard(page).locator("[data-settings-row-status]")).toHaveText("Saved");
  await expectSettingsCount(page, CEDAR, "0 projects");
});

// Its own test: with the moves above it made one test of about a dozen page loads, which under the CI's four workers
// took 22 to 34 s against the 30 s budget of a test. It reuses the project (in No group) and Dune desk from above.
test("a group deleted elsewhere is refused with a field error and the select goes back to the stored group", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, `/projects/${PROJECT}?tab=settings`);
  await waitForHydration(groupSelect(page));
  await expect(groupSelect(page)).toHaveText("No group");
  // The deletion below reaches this page only through the pick: holdScanRefresh keeps its data as rendered.
  const other = await page.context().newPage();
  await other.goto("/settings");
  const menu = settingsGroupRow(other, DUNE).getByRole("button", { name: `More actions for ${DUNE}` });
  await waitForHydration(menu);
  await menu.click();
  await other.getByRole("menuitem", { name: "Delete" }).click();
  await other.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(settingsGroupRow(other, DUNE)).toHaveCount(0);
  await other.close();
  await pickGroup(page, DUNE);
  await expect(groupCard(page).getByText("This group or project no longer exists. Reload the page.")).toBeVisible();
  await expect(groupSelect(page)).toHaveText("No group");
  await expect(groupCard(page).locator("[data-settings-row-status]")).toHaveText("");
});

test("the group select is a full-width touch target under its title on a phone", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, `/projects/${PROJECT}?tab=settings`);
  await waitForHydration(groupSelect(page));
  await expectTouchTarget(groupSelect(page));
  const card = await groupCard(page).getByRole("listitem").boundingBox();
  const select = await groupSelect(page).boundingBox();
  const title = await groupCard(page).getByRole("heading", { name: "Group", level: 3 }).boundingBox();
  expect(card).not.toBeNull();
  expect(select).not.toBeNull();
  expect(title).not.toBeNull();
  if (card !== null && select !== null && title !== null) {
    expect(select.y).toBeGreaterThanOrEqual(title.y + title.height);
    expect(select.width).toBeGreaterThanOrEqual(card.width - 1);
  }
  await pickGroup(page, CEDAR);
  await expect(groupCard(page).locator("[data-settings-row-status]")).toHaveText("Saved");
  await expectSettingsCount(page, CEDAR, "1 project");
});
