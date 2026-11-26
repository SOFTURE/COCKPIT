import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { expectStateInRightColumn } from "./expect-row-state.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { expectListEntryRows } from "./expect-list-entry-rows.ts";

// Shares the database with the other specs: it watches repositories no other spec uses and looks only at their pages.
test.describe.configure({ mode: "serial" });

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

const FULL = "/projects/example-org/history-full-app/history";

function tabs(page: Page) {
  return page.getByRole("navigation", { name: "History sections" });
}

test("a project's history shows CI, quality review, merges, releases and the doctor as tabs with counts and state icons", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of ["example-org/history-full-app", "example-org/history-refused-app"]) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }

  // The project page links to its history, which opens on the CI tab.
  await page.goto("/projects/example-org/history-full-app");
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(page).toHaveURL(/\/projects\/example-org\/history-full-app\/history$/);
  await expect(page.getByRole("heading", { name: "example-org/history-full-app", level: 1 })).toBeVisible();
  await expect(tabs(page).getByRole("link")).toHaveText(["CI2", "Quality review2", "Merges10", "Releases5", "Doctor4"]);
  await expect(tabs(page).getByRole("link", { name: /^CI/ })).toHaveAttribute("aria-current", "page");
  for (const icon of await tabs(page).getByRole("link").locator("svg").all()) {
    await expect(icon).toHaveAttribute("aria-hidden", "true");
  }

  // The latest CI runs with their result icon and word, dates and links.
  const ci = page.getByRole("list", { name: "Latest CI runs" }).getByRole("listitem");
  await expect(ci).toHaveCount(2);
  await expect(ci.nth(0)).toContainText("Failed");
  await expect(ci.nth(0).locator("[data-slot=result-badge][data-tone=danger] svg")).toHaveCount(1);
  await expect(ci.nth(0)).toContainText(/started Nov 20, 2026/);
  await expect(ci.nth(0).getByRole("link")).toHaveAttribute("href", "https://forge.example.test/runs/ci-2026-11-20T10:00:00Z");
  await expectListEntryRows(page, page.getByRole("list", { name: "Latest CI runs" }), "18-history-ci");
  // CT-19: a run's result sits on top of the row's right column.
  await expectStateInRightColumn(page, ci.nth(0), "Failed");
  // A tab shows only its own section.
  await expect(page.getByRole("list", { name: "Latest merges into the main branch" })).toHaveCount(0);

  // Each tab opens by its address.
  await page.goto(`${FULL}?tab=quality-review`);
  await expect(tabs(page).getByRole("link", { name: /^Quality review/ })).toHaveAttribute("aria-current", "page");
  const reviews = page.getByRole("list", { name: "Latest quality-review runs" }).getByRole("listitem");
  await expect(reviews).toHaveCount(2);
  await expect(reviews.nth(1)).toContainText("Passed");
  await expect(reviews.nth(1).locator("[data-slot=result-badge][data-tone=success] svg")).toHaveCount(1);

  // FR-11: the latest ten merges, newest first, with their merged state, dates and links; the one closed unmerged is not among them.
  await tabs(page).getByRole("link", { name: /^Merges/ }).click();
  await expect(page).toHaveURL(/\?tab=merges$/);
  const merges = page.getByRole("list", { name: "Latest merges into the main branch" }).getByRole("listitem");
  await expect(merges).toHaveCount(10);
  await expect(merges.nth(0)).toContainText("#12 History change 12");
  await expect(merges.nth(0)).toContainText("Merged");
  await expect(merges.nth(0).locator("[data-slot=result-badge][data-tone=success] svg")).toHaveCount(1);
  await expect(merges.nth(0)).toContainText(/Nov 20, 2026/);
  await expectStateInRightColumn(page, merges.nth(0), "Merged");
  await expectListEntryRows(page, page.getByRole("list", { name: "Latest merges into the main branch" }), "19-history-merges");
  await expect(merges.nth(0).getByRole("link")).toHaveAttribute("href", "https://forge.example.test/example-org/history-full-app/pull/12");
  await expect(merges.nth(9)).toContainText("#3 History change 3");
  await expect(page.getByRole("region", { name: "Recent merges" })).not.toContainText("History change 13");

  // The latest five releases, the draft left out, the prerelease marked, the others published.
  await page.goto(`${FULL}?tab=releases`);
  const releases = page.getByRole("list", { name: "Latest releases" }).getByRole("listitem");
  await expect(releases).toHaveCount(5);
  await expect(releases.nth(0)).toContainText("v1.6.0-rc.1");
  await expect(releases.nth(0).locator("[data-slot=result-badge][data-tone=muted]")).toContainText("Prerelease");
  await expect(releases.nth(1).locator("[data-slot=result-badge][data-tone=success]")).toContainText("Published");
  await expect(releases.nth(4)).toContainText("v1.2.0");
  await expect(page.getByRole("region", { name: "Releases" })).not.toContainText("v2.0.0");

  // The doctor's findings with their codes and files, and how many more the run lists.
  await page.goto(`${FULL}?tab=doctor`);
  const doctor = page.getByRole("region", { name: "Doctor findings" });
  await expect(doctor).toContainText("The doctor failed on the head of the main branch.");
  const findings = page.getByRole("list", { name: "Doctor findings, with their codes and files" }).getByRole("listitem");
  await expect(findings).toHaveCount(2);
  await expect(findings.nth(0)).toContainText("roadmap-left");
  await expect(findings.nth(0).locator("[data-slot=result-badge][data-tone=danger] svg")).toHaveCount(1);
  await expect(findings.nth(0)).toContainText("context/foundation/roadmap.md");
  await expectListEntryRows(page, page.getByRole("list", { name: "Doctor findings, with their codes and files" }), "20-history-doctor");
  await expect(findings.nth(1)).toContainText("archive-unstamped");
  await expect(findings.nth(1)).toContainText("context/archive/2026-11-02-history-search/change.md");
  await expect(doctor).toContainText("2 more findings are listed only in the run.");
  await expect(doctor.getByRole("link", { name: "Open the run" })).toHaveAttribute("href", "https://forge.example.test/checks/111");

  // An unknown tab opens CI.
  await page.goto(`${FULL}?tab=deploys`);
  await expect(tabs(page).getByRole("link", { name: /^CI/ })).toHaveAttribute("aria-current", "page");
});

test("a refused read shows its reason in its own tab while the other tabs load", async ({ page }) => {
  const base = "/projects/example-org/history-refused-app/history";
  await signIn(page, `${base}?tab=releases`);
  // A failed block's tab shows no count; the others count what they read.
  await expect(tabs(page).getByRole("link")).toHaveText(["CI0", "Quality review0", "Merges0", "Releases", "Doctor"]);
  const releases = page.getByRole("region", { name: "Releases" });
  await expect(releases.getByRole("alert")).toContainText("This could not be read");
  await expect(releases.getByRole("alert")).toContainText("Grant the access token: contents=read.");
  await page.goto(`${base}?tab=doctor`);
  await expect(page.getByRole("region", { name: "Doctor findings" }).getByRole("alert")).toContainText("needs Checks: read, which only a GitHub App can hold");
  // An empty tab says so in one line.
  await page.goto(`${base}?tab=merges`);
  await expect(page.getByRole("region", { name: "Recent merges" })).toContainText("No pull request was merged into the main branch yet.");
  await page.goto(base);
  await expect(page.getByRole("region", { name: "CI" })).toContainText("No CI run on the main branch yet.");
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("every history tab fits without horizontal scroll and its tab links are touch-sized", async ({ page }) => {
    await signIn(page, FULL);
    await expect(page.getByRole("heading", { name: "example-org/history-full-app", level: 1 })).toBeVisible();
    for (const tab of await tabs(page).getByRole("link").all()) {
      const box = await tab.boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    for (const key of ["ci", "quality-review", "merges", "releases", "doctor"]) {
      await page.goto(`${FULL}?tab=${key}`);
      await expect(page.locator(`[data-tab-panel="${key}"]`)).toBeVisible();
      const overflow = await page.evaluate(() => document.body.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `tab ${key}`).toBeLessThanOrEqual(0);
    }
  });
});
