import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { expectStateInRightColumn } from "./expect-row-state.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";

// Shares the database with the other specs: it watches repositories no other spec uses and looks only at their rows.
test.describe.configure({ mode: "serial" });

const PROJECTS = {
  "example-org/kappa-app": "Broken",
  "example-org/xi-app": "Waiting for you",
  "example-org/nu-app": "Stalled",
  "example-org/lambda-app": "Moving",
  "example-org/mu-app": "Idle",
} as const;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("after a scan the overview groups each project under its status with the numbers behind it", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of Object.keys(PROJECTS)) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
  await scanUntilSettled(page, Object.keys(PROJECTS));

  await page.getByRole("list", { name: "Main" }).getByRole("link", { name: "Projects" }).click();
  await expect(page.getByRole("heading", { name: "Projects", level: 1 })).toBeVisible();
  for (const [name, status] of Object.entries(PROJECTS)) {
    const group = page.getByRole("list", { name: `Projects: ${status}`, exact: true });
    await expect(group.locator(`[data-project="${name}"]`)).toHaveCount(1);
  }

  const kappa = page.locator('[data-project="example-org/kappa-app"]');
  await expect(kappa).toContainText("The last CI run on its main branch failed.");
  await expect(kappa).toContainText("CI failed");
  // CT-19: the project's status sits on top of the row's right column, and the whole row opens the project.
  await expectStateInRightColumn(page, kappa, "Broken");
  await expect(kappa.locator("[data-row-link]")).toHaveAttribute("href", "/projects/example-org/kappa-app");
  await expect(kappa).toContainText("alpha-v1 1/3 · Alpha v1");
  // FR-7, FR-8: a failing doctor shows its number of failures, names the codes and makes the project broken.
  await expect(kappa).toContainText("Its context doctor fails on the main branch");
  await expect(kappa.locator('[data-doctor="failing"]')).toHaveText("Doctor: 3 failures");
  await expect(kappa.locator('[data-doctor="failing"]')).toHaveAttribute("title", "archive.unstamped ×1, roadmap.stale ×2");
  await expect(page.locator('[data-project="example-org/xi-app"] [data-doctor="ok"]')).toHaveText("Doctor OK");
  // Success reads green, work in progress blue, failure red.
  await expect(page.locator('[data-project="example-org/xi-app"] [data-doctor="ok"]')).toHaveAttribute("data-tone", "green");
  await expect(kappa.locator('[data-doctor="failing"]')).toHaveAttribute("data-tone", "red");
  await expect(page.locator('[data-project="example-org/lambda-app"] [data-doctor="pending"]')).toHaveAttribute("data-tone", "gray");
  await expect(page.locator('[data-project="example-org/lambda-app"] [data-doctor="pending"]')).toHaveText("Doctor pending");
  await expect(page.locator('[data-project="example-org/nu-app"] [data-doctor="missing"]')).toHaveText("Doctor: no context-doctor job");

  const mu = page.locator('[data-project="example-org/mu-app"]');
  await expect(mu).toContainText("No active roadmap");
  await expect(mu).toContainText("Queued 1");
  await expect(mu).toContainText("Changes 0");
  await expect(mu).toContainText("Waiting 0");
  await expect(mu).toContainText("Release v1.4.0 (2026-11-03)");
  await expect(mu).toContainText("Doctor OK");
  await expect(mu).toContainText("CI passed");
  await expect(mu).toContainText("Quality review passed");
  await expect(mu.locator('[data-tone]', { hasText: "CI passed" })).toHaveAttribute("data-tone", "green");
  await expect(page.locator('[data-project="example-org/xi-app"]')).toContainText("Waiting 1");

  // FR-8: the sidebar shows each project's status as an icon that keeps its word.
  const sidebarProjects = page.getByRole("list", { name: "Projects", exact: true });
  await expect(sidebarProjects.getByRole("link", { name: "example-org/kappa-app" })).toContainText("Broken");
  await expect(sidebarProjects.getByRole("link", { name: "example-org/mu-app" }).locator('[data-status="idle"]')).toHaveAttribute("title", "Idle");
  // An idle project's moon is blue.
  await expect(sidebarProjects.getByRole("link", { name: "example-org/mu-app" }).locator('[data-status="idle"]')).toHaveClass(/text-blue/);
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the overview fits without horizontal scroll", async ({ page }) => {
    await signIn(page, "/projects");
    await expect(page.getByRole("heading", { name: "Projects", level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
