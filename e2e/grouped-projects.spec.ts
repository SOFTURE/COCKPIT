import { authMessages } from "@softure-ai/auth";
import type { Locator, Page } from "@playwright/test";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { captureEvidence } from "./capture-evidence.ts";
import { GROUPED_LIST_REPOSITORIES, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";
import { submitRepository } from "./submit-repository.ts";
import { waitForHydration } from "./wait-for-hydration.ts";

// The projects list and Settings' watched list in the owner's project groups (CT-32): one section per group in name
// order with its count, No group last, every row keeping its status; a project moved on its Settings tab (CT-31) moves
// its row, and a deleted group's projects fall under No group (deferred from CT-30). The database is shared: the groups
// and repositories here are used by this spec only, and no count or position of another spec's group is fixed.
test.describe.configure({ mode: "serial" });

const ELM = "Elm desk";
const FIR = "Fir desk";
const [ELM_APP, ELM_DOCS] = GROUPED_LIST_REPOSITORIES.elm;
const [FIR_APP] = GROUPED_LIST_REPOSITORIES.fir;
const [LOOSE_APP] = GROUPED_LIST_REPOSITORIES.loose;
const ALL = [ELM_APP, ELM_DOCS, FIR_APP, LOOSE_APP];

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

function sectionLabels(scope: Locator): Promise<string[]> {
  return scope.locator("section[aria-label^='Group: ']").evaluateAll((sections) => sections.map((section) => section.getAttribute("aria-label") ?? ""));
}

function section(scope: Locator | Page, group: string): Locator {
  return scope.getByRole("region", { name: `Group: ${group}`, exact: true });
}

function projectRows(page: Page, group: string): Locator {
  return page.getByRole("list", { name: `Projects: ${group}`, exact: true }).locator("[data-project]");
}

function watchedCard(page: Page): Locator {
  return page.getByRole("region", { name: "Watched repositories" });
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

async function moveProject(page: Page, project: string, group: string) {
  await page.goto(`/projects/${project}?tab=settings`);
  const select = page.getByRole("region", { name: "Group" }).getByRole("combobox", { name: "Group" });
  await waitForHydration(select);
  await select.click();
  await page.getByRole("option", { name: group, exact: true }).click();
  await expect(page.getByRole("region", { name: "Group" }).locator("[data-settings-row-status]")).toHaveText("Saved");
}

test("the projects list and the watched list show one section per group, No group last, at 1280 px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, "/settings");
  await addGroup(page, FIR, "fir-labs");
  await addGroup(page, ELM, "elm-works");
  for (const fullName of ALL) {
    await submitRepository(page, fullName);
    await expect(watchedCard(page).getByRole("status").first()).toContainText(`${fullName} is now watched.`);
  }
  await scanUntilSettled(page, ALL);

  await page.goto("/projects");
  await expect(page.getByRole("heading", { name: "Projects", level: 1 })).toBeVisible();
  const main = page.locator("main");
  // Groups in name order, No group last; the "Last scan" line above the first section.
  const labels = await sectionLabels(main);
  expect(labels.indexOf(`Group: ${ELM}`)).toBeGreaterThanOrEqual(0);
  expect(labels.indexOf(`Group: ${ELM}`)).toBeLessThan(labels.indexOf(`Group: ${FIR}`));
  expect(labels.at(-1)).toBe("Group: No group");
  const lastScan = await main.getByText(/^(Last scan finished|No scan has finished yet)/).boundingBox();
  const firstSection = await main.locator("section[aria-label^='Group: ']").first().boundingBox();
  expect(lastScan !== null && firstSection !== null && lastScan.y < firstSection.y).toBe(true);
  // Each heading: the group's name, then its count.
  await expect(section(page, ELM).getByRole("heading", { level: 2 })).toHaveText(`${ELM}2`);
  await expect(section(page, FIR).getByRole("heading", { level: 2 })).toHaveText(`${FIR}1`);
  // Inside a group: status order, then name; every row keeps its own status.
  await expect(projectRows(page, ELM)).toHaveCount(2);
  expect(await projectRows(page, ELM).evaluateAll((rows) => rows.map((row) => row.getAttribute("data-project")))).toEqual([ELM_APP, ELM_DOCS]);
  for (const name of ALL) {
    await expect(page.locator(`[data-project="${name}"] [data-slot=list-entry-status]`)).toContainText("Waiting for you");
  }
  await expect(projectRows(page, FIR)).toHaveCount(1);
  await expect(projectRows(page, "No group").and(page.locator(`[data-project="${LOOSE_APP}"]`))).toHaveCount(1);
  await captureEvidence(page, { name: "01-projects", target: (current) => current.locator("main") });

  // Settings' watched list: the same sections inside its card.
  await page.goto("/settings");
  const card = watchedCard(page);
  const watchedLabels = await sectionLabels(card);
  expect(watchedLabels.indexOf(`Group: ${ELM}`)).toBeLessThan(watchedLabels.indexOf(`Group: ${FIR}`));
  expect(watchedLabels.at(-1)).toBe("Group: No group");
  await expect(section(card, ELM).getByRole("heading", { level: 2 })).toHaveText(`${ELM}2`);
  const elmList = card.getByRole("list", { name: `Watched repositories: ${ELM}`, exact: true });
  await expect(elmList.getByRole("listitem")).toHaveText([new RegExp(ELM_APP), new RegExp(ELM_DOCS)]);
  await expect(card.getByRole("list", { name: `Watched repositories: ${FIR}`, exact: true }).getByRole("listitem")).toContainText([FIR_APP]);
  await expect(card.getByRole("list", { name: "Watched repositories: No group", exact: true }).getByRole("listitem").filter({ hasText: LOOSE_APP })).toHaveCount(1);
  await captureEvidence(page, { name: "02-watched-list", target: watchedCard });

  // A project moved on its Settings tab moves its row; its emptied group is no longer shown.
  await moveProject(page, FIR_APP, ELM);
  await page.goto("/projects");
  await expect(projectRows(page, ELM)).toHaveCount(3);
  await expect(section(page, ELM).getByRole("heading", { level: 2 })).toHaveText(`${ELM}3`);
  await expect(section(page, FIR)).toHaveCount(0);
  await moveProject(page, FIR_APP, "No group");
  await page.goto("/projects");
  await expect(projectRows(page, "No group").and(page.locator(`[data-project="${FIR_APP}"]`))).toHaveCount(1);
  await expect(projectRows(page, ELM)).toHaveCount(2);
  await moveProject(page, FIR_APP, FIR);
  await page.goto("/projects");
  await expect(projectRows(page, FIR)).toHaveCount(1);
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the sections stack with their counts and fit without horizontal scroll", async ({ page }) => {
    await signIn(page, "/projects");
    await expect(section(page, ELM).getByRole("heading", { level: 2 })).toHaveText(`${ELM}2`);
    await expect(projectRows(page, ELM)).toHaveCount(2);
    const labels = await sectionLabels(page.locator("main"));
    expect(labels.indexOf(`Group: ${ELM}`)).toBeLessThan(labels.indexOf(`Group: ${FIR}`));
    expect(labels.at(-1)).toBe("Group: No group");
    // 24 px between sections, 4 px between a heading and its list.
    const [elm, fir] = await Promise.all([section(page, ELM).boundingBox(), section(page, FIR).boundingBox()]);
    const heading = await section(page, ELM).getByRole("heading", { level: 2 }).boundingBox();
    const list = await section(page, ELM).getByRole("list").boundingBox();
    expect(heading !== null && list !== null && Math.round(list.y - (heading.y + heading.height))).toBe(4);
    if (elm !== null && fir !== null && labels.indexOf(`Group: ${FIR}`) === labels.indexOf(`Group: ${ELM}`) + 1) {
      expect(Math.round(fir.y - (elm.y + elm.height))).toBe(24);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test("a deleted group's projects show under No group on the projects list", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, "/settings");
  const row = page
    .getByRole("region", { name: "Project groups" })
    .getByRole("list", { name: "Project groups" })
    .getByRole("listitem")
    .filter({ has: page.getByText(FIR, { exact: true }) });
  const menu = row.getByRole("button", { name: `More actions for ${FIR}` });
  await waitForHydration(menu);
  await menu.click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog", { name: `Delete the group ${FIR}?` }).getByRole("button", { name: "Delete" }).click();
  await expect(row).toHaveCount(0);

  await page.goto("/projects");
  await expect(section(page, FIR)).toHaveCount(0);
  await expect(projectRows(page, "No group").and(page.locator(`[data-project="${FIR_APP}"]`))).toHaveCount(1);
  await expect(projectRows(page, ELM)).toHaveCount(2);
});
