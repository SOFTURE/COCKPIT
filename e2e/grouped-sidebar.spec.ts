import { authMessages } from "@softure-ai/auth";
import type { Locator, Page } from "@playwright/test";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { captureEvidence } from "./capture-evidence.ts";
import { expectTouchTarget } from "./expect-touch-target.ts";
import { GROUPED_SIDEBAR_REPOSITORIES, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";
import { submitRepository } from "./submit-repository.ts";
import { waitForHydration } from "./wait-for-hydration.ts";

// The sidebar's project links in the owner's project groups (CT-33): one label per group in name order, No group last,
// every link keeping its status icon and its active state; on a phone inside the sheet, 44 px links, the account
// footer still on screen. The database is shared: the groups and repositories here are used by this spec only, and no
// count or position of another spec's group is fixed.
test.describe.configure({ mode: "serial" });

const MAPLE = "Maple desk";
const PINE = "Pine desk";
const [MAPLE_APP, MAPLE_DOCS] = GROUPED_SIDEBAR_REPOSITORIES.maple;
const [PINE_APP] = GROUPED_SIDEBAR_REPOSITORIES.pine;
const [LOOSE_APP] = GROUPED_SIDEBAR_REPOSITORIES.loose;
const ALL = [MAPLE_APP, MAPLE_DOCS, PINE_APP, LOOSE_APP];
/** Below the theme's `md` breakpoint the sidebar is a sheet opened from the header. */
const MOBILE_BREAKPOINT_PX = 768;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

/** The sidebar on screen: the fixed column on a desktop, the open sheet on a phone. */
function sidebar(page: Page): Locator {
  return page.locator('[data-sidebar="sidebar"]:visible');
}

function groupLinks(page: Page, group: string): Locator {
  return sidebar(page).getByRole("list", { name: group, exact: true }).getByRole("link");
}

function groupLabels(page: Page): Promise<string[]> {
  return sidebar(page)
    .locator('[data-sidebar="group-label"]')
    .evaluateAll((labels) => labels.map((label) => label.textContent ?? ""));
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
  // The sheet slides in from the left edge; it is in place once its left edge reaches the screen's.
  await expect.poll(async () => Math.round((await sheet.boundingBox())?.x ?? -1)).toBe(0);
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

async function expectGroupsInOrder(page: Page) {
  await expect(groupLinks(page, MAPLE)).toHaveText([MAPLE_APP, MAPLE_DOCS].map((name) => new RegExp(name)));
  await expect(groupLinks(page, PINE)).toHaveText([new RegExp(PINE_APP)]);
  await expect(groupLinks(page, "No group").filter({ hasText: LOOSE_APP })).toHaveCount(1);
  const labels = await groupLabels(page);
  expect(labels).not.toContain("Projects");
  expect(labels.indexOf(MAPLE)).toBeGreaterThanOrEqual(0);
  expect(labels.indexOf(MAPLE)).toBeLessThan(labels.indexOf(PINE));
  expect(labels.at(-1)).toBe("No group");
  // Each group's list is labelled with its name and sits right under its label.
  const lists = await sidebar(page)
    .locator('[data-sidebar="group"]')
    .evaluateAll((groups) =>
      groups.flatMap((group) => {
        const label = group.querySelector('[data-sidebar="group-label"]');
        const menu = group.querySelector('[data-sidebar="menu"]');
        return label === null ? [] : [{ label: label.textContent ?? "", list: menu?.getAttribute("aria-label") ?? null }];
      }),
    );
  expect(lists.every(({ label, list }) => label === list)).toBe(true);
}

test("the sidebar shows one label per project group, No group last, at 1280 px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, "/settings");
  await addGroup(page, PINE, "pine-yard");
  await addGroup(page, MAPLE, "maple-row");
  for (const fullName of ALL) {
    await submitRepository(page, fullName);
    await expect(page.getByRole("region", { name: "Watched repositories" }).getByRole("status").first()).toContainText(`${fullName} is now watched.`);
  }
  await scanUntilSettled(page, ALL);

  await page.goto(`/projects/${MAPLE_DOCS}`);
  await expect(page.getByRole("heading", { name: MAPLE_DOCS, level: 1 })).toBeVisible();
  await captureEvidence(page, { name: "01-sidebar", target: sidebar, prepare: openSheetOnPhone });

  await expectGroupsInOrder(page);
  // The group's full name on hover; the label's text truncates.
  await expect(sidebar(page).locator('[data-sidebar="group-label"]', { hasText: MAPLE }).locator("[title]")).toHaveAttribute("title", MAPLE);
  // Every link keeps its status icon; the open project's link is the active one.
  for (const name of ALL) {
    await expect(sidebar(page).getByRole("link").filter({ hasText: name }).locator("[data-status]")).toHaveCount(1);
  }
  await expect(groupLinks(page, MAPLE).filter({ hasText: MAPLE_DOCS })).toHaveAttribute("aria-current", "page");
  await expect(sidebar(page).locator('[data-sidebar="group"]:has([data-sidebar="group-label"]) [aria-current="page"]')).toHaveCount(1);
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the sheet shows the groups in order with 44 px links and the account footer on screen", async ({ page }) => {
    await signIn(page, "/inbox");
    await openSheetOnPhone(page);
    await expectGroupsInOrder(page);
    for (const link of await groupLinks(page, MAPLE).all()) {
      await expectTouchTarget(link);
    }
    // The groups scroll inside the sidebar; the footer stays on the 844 px screen.
    const footer = await page.locator('[data-sidebar="footer"]:visible').boundingBox();
    expect(footer !== null && footer.y + footer.height <= 844).toBe(true);

    await groupLinks(page, PINE).filter({ hasText: PINE_APP }).click();
    // The sheet stays open over the project page it opened; its link is now the active one.
    await expect(page).toHaveURL(new RegExp(`/projects/${PINE_APP}$`));
    await expect(groupLinks(page, PINE).filter({ hasText: PINE_APP })).toHaveAttribute("aria-current", "page");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
