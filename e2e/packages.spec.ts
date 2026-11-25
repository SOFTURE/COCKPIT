import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { expectFieldHelp } from "./field-help.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";

// CT-1: the nightly package updates of every watched project, from the fake forge's pull requests, runs and files
// and its fake npm registry (e2e/fake-forge.ts). Shares the database with the other specs: it watches repositories no
// other spec uses and looks only at their cards.
test.describe.configure({ mode: "serial" });

const PROJECTS = ["example-org/packages-merged-app", "example-org/packages-red-app", "example-org/packages-held-app", "example-org/packages-new-app"] as const;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

function card(page: Page, name: string) {
  return page.getByRole("region", { name, exact: true });
}

test("the Packages page shows each project's last update, held packages and versions behind npm", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of PROJECTS) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
  await scanUntilSettled(page, PROJECTS);

  await page.goto("/");
  await page.getByRole("list", { name: "Main" }).getByRole("link", { name: "Packages", exact: true }).click();
  await expect(page).toHaveURL(/\/packages$/);
  await expect(page.getByRole("heading", { name: "Packages", level: 1 })).toBeVisible();

  // Merged, with one key package behind the newest on npm.
  const merged = card(page, "example-org/packages-merged-app");
  await expect(merged.locator('[data-package-update="merged"]')).toHaveText("Merged");
  await expect(merged.getByRole("link", { name: "#50" })).toHaveAttribute("href", "https://forge.example.test/example-org/packages-merged-app/pull/50");
  await expect(merged).toContainText("1 behind");
  const skills = merged.locator('[data-package="@softure-ai/skills"]');
  await expect(skills).toHaveAttribute("data-package-behind", "true");
  await expect(skills).toContainText("In the lockfile: 0.35.0");
  await expect(skills).toContainText("Newest: 0.36.0");
  await expect(skills).toContainText("Behind");
  await expect(skills.locator('[data-tone="orange"]')).toHaveText("Behind");
  await expect(merged.locator('[data-package="@softure-ai/auth"] [data-tone="green"]')).toHaveText("Current");
  await expect(merged.locator('[data-package="@softure-ai/auth"]')).toHaveAttribute("data-package-behind", "false");
  // The key packages come first.
  await expect(merged.locator("[data-package]").first()).toHaveAttribute("data-package", "@softure-ai/skills");
  await expect(merged).toContainText("Nothing held back.");

  // Open and red, named by its failing job.
  const red = card(page, "example-org/packages-red-app");
  await expect(red.locator('[data-package-update="failed"]')).toHaveText("Red: e2e");

  // A held package with its issue.
  const held = card(page, "example-org/packages-held-app");
  const heldUi = held.locator('[data-held-package="@softure-ai/ui"]');
  await expect(heldUi.getByRole("link", { name: "SOFTURE/AI#123" })).toHaveAttribute("href", /\/SOFTURE\/AI\/issues\/123$/);
  await expect(heldUi).toContainText("since 2026-11-20");
  await expect(held.locator('[data-package="@softure-ai/ui"]')).toHaveAttribute("data-package-behind", "true");

  // No update yet.
  const none = card(page, "example-org/packages-new-app").locator('[data-package-update="none"]');
  await expect(none).toHaveText("No package update yet");
  await expectFieldHelp(page, {
    button: card(page, "example-org/packages-new-app").getByRole("button", { name: "Help: No package update yet" }),
    text: "The nightly routine has not opened a pull request in this project.",
    describes: none,
  });

  // A project without package.json is left out.
  await expect(card(page, "example-org/alpha-app")).toHaveCount(0);
});

test("the Packages page fits a phone at 390 px", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page, "/packages");
  await expect(card(page, "example-org/packages-held-app")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
