import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";

// Shares the database with the other specs: it watches repositories no other spec uses and looks only at their pages.
test.describe.configure({ mode: "serial" });

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("a project's history shows merges, releases, runs and the doctor's findings with code and file", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of ["example-org/upsilon-app", "example-org/chi-app"]) {
    await page.getByLabel("Repository").fill(name);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }

  // The project page links to its history.
  await page.goto("/projects/example-org/upsilon-app");
  await page.getByRole("link", { name: "History" }).click();
  await expect(page).toHaveURL(/\/projects\/example-org\/upsilon-app\/history$/);
  await expect(page.getByRole("heading", { name: "example-org/upsilon-app", level: 1 })).toBeVisible();

  // FR-11: the latest ten merges, newest first, with dates and links; the one closed unmerged is not among them.
  const merges = page.getByRole("list", { name: "Latest merges into the main branch" }).getByRole("listitem");
  await expect(merges).toHaveCount(10);
  await expect(merges.nth(0)).toContainText("#12 Upsilon change 12");
  await expect(merges.nth(0)).toContainText(/merged Nov 20, 2026/);
  await expect(merges.nth(0).getByRole("link")).toHaveAttribute("href", "https://forge.example.test/example-org/upsilon-app/pull/12");
  await expect(merges.nth(9)).toContainText("#3 Upsilon change 3");
  await expect(page.getByRole("region", { name: "Recent merges" })).not.toContainText("Upsilon change 13");

  // The latest five releases, the draft left out, the prerelease marked.
  const releases = page.getByRole("list", { name: "Latest releases" }).getByRole("listitem");
  await expect(releases).toHaveCount(5);
  await expect(releases.nth(0)).toContainText("v1.6.0-rc.1");
  await expect(releases.nth(0)).toContainText("Prerelease");
  await expect(releases.nth(4)).toContainText("v1.2.0");
  await expect(page.getByRole("region", { name: "Releases" })).not.toContainText("v2.0.0");

  // The latest CI and quality-review runs with their results, dates and links.
  const ci = page.getByRole("list", { name: "Latest CI runs" }).getByRole("listitem");
  await expect(ci).toHaveCount(2);
  await expect(ci.nth(0)).toContainText("Failed");
  await expect(ci.nth(0)).toContainText(/started Nov 20, 2026/);
  await expect(ci.nth(0).getByRole("link")).toHaveAttribute("href", "https://forge.example.test/runs/ci-2026-11-20T10:00:00Z");
  const reviews = page.getByRole("list", { name: "Latest quality-review runs" }).getByRole("listitem");
  await expect(reviews).toHaveCount(2);
  await expect(reviews.nth(1)).toContainText("Passed");

  // The doctor's findings with their codes and files, and how many more the run lists.
  const doctor = page.getByRole("region", { name: "Doctor findings" });
  await expect(doctor).toContainText("The doctor failed on the head of the main branch.");
  const findings = page.getByRole("list", { name: "Doctor findings, with their codes and files" }).getByRole("listitem");
  await expect(findings).toHaveCount(2);
  await expect(findings.nth(0)).toContainText("roadmap-left");
  await expect(findings.nth(0)).toContainText("context/foundation/roadmap.md");
  await expect(findings.nth(1)).toContainText("archive-unstamped");
  await expect(findings.nth(1)).toContainText("context/archive/2026-11-02-upsilon-search/change.md");
  await expect(doctor).toContainText("2 more findings are listed only in the run.");
  await expect(doctor.getByRole("link", { name: "Open the run" })).toHaveAttribute("href", "https://forge.example.test/checks/111");
});

test("a refused read shows its reason in its own block while the rest of the history loads", async ({ page }) => {
  await signIn(page, "/projects/example-org/chi-app/history");
  const releases = page.getByRole("region", { name: "Releases" });
  await expect(releases.getByRole("alert")).toContainText("This could not be read");
  await expect(releases.getByRole("alert")).toContainText("Grant the access token: contents=read.");
  const doctor = page.getByRole("region", { name: "Doctor findings" });
  await expect(doctor.getByRole("alert")).toContainText("needs Checks: read, which only a GitHub App can hold");
  await expect(page.getByRole("region", { name: "Recent merges" })).toContainText("No pull request was merged into the main branch yet.");
  await expect(page.getByRole("region", { name: "CI and quality review" })).toContainText("No CI run on the main branch yet.");
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the history fits without horizontal scroll", async ({ page }) => {
    await signIn(page, "/projects/example-org/upsilon-app/history");
    await expect(page.getByRole("heading", { name: "example-org/upsilon-app", level: 1 })).toBeVisible();
    await expect(page.getByRole("list", { name: "Latest merges into the main branch" }).getByRole("listitem")).toHaveCount(10);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
