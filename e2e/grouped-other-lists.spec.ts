import { authMessages } from "@softure-ai/auth";
import type { Locator, Page } from "@playwright/test";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { captureEvidence } from "./capture-evidence.ts";
import { GROUPED_OTHER_REPOSITORIES, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";
import { submitRepository } from "./submit-repository.ts";
import { waitForHydration } from "./wait-for-hydration.ts";

// Scan status, Packages and Deploys in the owner's project groups (CT-35), laid out like the Projects page (CT-32): one
// section per group in name order with its count, No group last, an empty group left out (Hazel has no app with a deploy
// workflow), every row unchanged. The database is shared: the groups and repositories here are used by this spec only,
// and no count or position of another spec's group is fixed.
test.describe.configure({ mode: "serial" });

const OAK = "Oak desk";
const HAZEL = "Hazel desk";
const [OAK_APP, OAK_DOCS] = GROUPED_OTHER_REPOSITORIES.oak;
const [HAZEL_APP] = GROUPED_OTHER_REPOSITORIES.hazel;
const [STRAY_APP] = GROUPED_OTHER_REPOSITORIES.stray;
const ALL = [OAK_APP, OAK_DOCS, HAZEL_APP, STRAY_APP];

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

function scanCard(page: Page): Locator {
  return page.getByRole("region", { name: "Projects", exact: true });
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

/** Hazel before Oak, No group last; the given groups present, the absent ones not shown. */
async function expectSectionOrder(scope: Locator, { present, absent }: { readonly present: readonly string[]; readonly absent: readonly string[] }) {
  const labels = await sectionLabels(scope);
  for (const group of present) {
    expect(labels).toContain(`Group: ${group}`);
  }
  for (const group of absent) {
    expect(labels).not.toContain(`Group: ${group}`);
  }
  if (present.includes(OAK) && present.includes(HAZEL)) {
    expect(labels.indexOf(`Group: ${HAZEL}`)).toBeLessThan(labels.indexOf(`Group: ${OAK}`));
  }
  expect(labels.at(-1)).toBe("Group: No group");
}

async function expectNoSideScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

test("Scan status, Packages and Deploys show one section per group, No group last, at 1280 px", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await signIn(page, "/settings");
  await addGroup(page, HAZEL, "hazel-labs");
  await addGroup(page, OAK, "oak-works");
  for (const fullName of ALL) {
    await submitRepository(page, fullName);
    await expect(page.getByRole("region", { name: "Watched repositories" }).getByRole("status").first()).toContainText(`${fullName} is now watched.`);
  }
  await scanUntilSettled(page, ALL);

  // Scan status: the sections inside the Projects card, each row keeping its read.
  await page.goto("/scan-status");
  const card = scanCard(page);
  await expect(card.getByRole("listitem").filter({ hasText: OAK_APP })).toBeVisible();
  await captureEvidence(page, { name: "01-scan-status", target: scanCard });
  await expectSectionOrder(card, { present: [OAK, HAZEL], absent: [] });
  await expect(section(card, OAK).getByRole("heading", { level: 2 })).toHaveText(`${OAK}2`);
  await expect(section(card, HAZEL).getByRole("heading", { level: 2 })).toHaveText(`${HAZEL}1`);
  const oakScan = card.getByRole("list", { name: `Projects by last read: ${OAK}`, exact: true }).getByRole("listitem");
  await expect(oakScan).toHaveText([new RegExp(OAK_APP), new RegExp(OAK_DOCS)]);
  await expect(oakScan.first().locator("[data-slot=list-entry-status]")).toHaveText("Read");
  await expect(card.getByRole("list", { name: "Projects by last read: No group", exact: true }).getByRole("listitem").filter({ hasText: STRAY_APP })).toHaveCount(1);

  // Packages: the project cards under their group's heading.
  await page.goto("/packages");
  const main = page.locator("main");
  await expect(main.getByRole("region", { name: OAK_APP, exact: true })).toBeVisible();
  await captureEvidence(page, { name: "02-packages", target: (current) => current.locator("main") });
  await expectSectionOrder(main, { present: [OAK, HAZEL], absent: [] });
  await expect(section(main, OAK).getByRole("heading", { level: 2, name: OAK })).toHaveText(`${OAK}2`);
  await expect(section(main, OAK).getByRole("region", { name: OAK_APP, exact: true })).toBeVisible();
  await expect(section(main, OAK).getByRole("region", { name: OAK_DOCS, exact: true })).toBeVisible();
  await expect(section(main, HAZEL).getByRole("region", { name: HAZEL_APP, exact: true })).toBeVisible();
  await expect(section(main, "No group").getByRole("region", { name: STRAY_APP, exact: true })).toBeVisible();
  const lastScan = await main.getByText(/^(Last scan finished|No scan has finished yet)/).boundingBox();
  const firstSection = await main.locator("section[aria-label^='Group: ']").first().boundingBox();
  expect(lastScan !== null && firstSection !== null && lastScan.y < firstSection.y).toBe(true);

  // Deploys: only apps with a deploy workflow; Hazel has none, so no Hazel section.
  await page.goto("/deploys");
  await expect(main.locator(`[data-project="${OAK_APP}"]`)).toBeVisible();
  await captureEvidence(page, { name: "03-deploys", target: (current) => current.locator("main") });
  await expectSectionOrder(main, { present: [OAK], absent: [HAZEL] });
  const oakDeploys = main.getByRole("list", { name: `Apps with a deploy workflow: ${OAK}`, exact: true });
  await expect(section(main, OAK).getByRole("heading", { level: 2 })).toHaveText(`${OAK}1`);
  await expect(oakDeploys.locator("[data-project]")).toHaveCount(1);
  await expect(oakDeploys.locator(`[data-project="${OAK_APP}"] [data-deploy-result="passed"]`)).toHaveText("Deploy passed");
  await expect(main.getByRole("list", { name: "Apps with a deploy workflow: No group", exact: true }).locator(`[data-project="${STRAY_APP}"]`)).toHaveCount(1);
  await expect(main.locator(`[data-project="${OAK_DOCS}"], [data-project="${HAZEL_APP}"]`)).toHaveCount(0);
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the three screens stack their sections and fit without horizontal scroll", async ({ page }) => {
    await signIn(page, "/scan-status");
    const card = scanCard(page);
    await expect(section(card, OAK).getByRole("heading", { level: 2 })).toHaveText(`${OAK}2`);
    await expectSectionOrder(card, { present: [OAK, HAZEL], absent: [] });
    await expect(card.getByRole("list", { name: `Projects by last read: ${HAZEL}`, exact: true }).getByRole("listitem")).toHaveText([new RegExp(HAZEL_APP)]);
    await expectNoSideScroll(page);

    await page.goto("/packages");
    const main = page.locator("main");
    await expect(section(main, HAZEL).getByRole("region", { name: HAZEL_APP, exact: true })).toBeVisible();
    await expectSectionOrder(main, { present: [OAK, HAZEL], absent: [] });
    await expectNoSideScroll(page);

    await page.goto("/deploys");
    await expect(section(main, OAK).getByRole("heading", { level: 2 })).toHaveText(`${OAK}1`);
    await expectSectionOrder(main, { present: [OAK], absent: [HAZEL] });
    await expect(main.getByRole("list", { name: `Apps with a deploy workflow: ${OAK}`, exact: true }).locator(`[data-project="${OAK_APP}"]`)).toBeVisible();
    await expectNoSideScroll(page);
  });
});
