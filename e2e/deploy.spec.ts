import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";

// FR-17: the deploy state from the projects' deploy workflow runs and release reports (e2e/fake-forge.ts). Shares
// the database with the other specs: it watches repositories no other spec uses and looks only at their pages.
test.describe.configure({ mode: "serial" });

const PROJECTS = ["example-org/omega-app", "example-org/omega-web", "example-org/omega-docs"] as const;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("after a scan a project's page shows its version in production and its last deploy", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of PROJECTS) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
  await scanUntilSettled(page, PROJECTS);

  // Deployed and verified.
  await page.goto("/projects/example-org/omega-app?tab=production");
  const deployed = page.getByRole("region", { name: "Deploy" });
  await expect(deployed.locator('[data-deploy-production="known"]')).toContainText("In production");
  await expect(deployed.locator('[data-deploy-version="production"]')).toHaveText("v2.1.0");
  await expect(deployed.locator('[data-deploy-last="passed"]')).toContainText("Last deploy");
  await expect(deployed.locator('[data-deploy-version="last"]')).toHaveText("v2.1.0");
  // Success reads green, not grey.
  await expect(deployed.locator('[data-deploy-result="passed"]')).toHaveText("Deploy passed");
  await expect(deployed.locator('[data-deploy-result="passed"]')).toHaveAttribute("data-tone", "success");
  await expect(deployed.locator('[data-deploy-verify="passed"]')).toHaveText("Verification passed");
  await expect(deployed.locator('[data-deploy-verify="passed"]')).toHaveAttribute("data-tone", "success");
  await expect(deployed.getByRole("link", { name: "Open the run" })).toHaveAttribute("href", /\/actions\/runs\/701$/);

  // The last deploy failed at a server step; production still runs the earlier release.
  await page.goto("/projects/example-org/omega-web?tab=production");
  const failed = page.getByRole("region", { name: "Deploy" });
  await expect(failed.locator('[data-deploy-version="production"]')).toHaveText("v1.0.0");
  await expect(failed.locator('[data-deploy-result="failed"]')).toHaveText("Deploy failed at migrate");
  await expect(failed.locator('[data-deploy-result="failed"]')).toHaveAttribute("data-tone", "danger");
  await expect(failed.locator('[data-deploy-verify="skipped"]')).toHaveText("Verification skipped");
  await expect(failed.locator('[data-deploy-verify="skipped"]')).toHaveAttribute("data-tone", "warning");
  await expect(failed.locator('[data-deploy-version="last"]')).toHaveText("v1.1.0");

  // No deploy workflow: nothing extra.
  await page.goto("/projects/example-org/omega-docs");
  await expect(page.getByRole("heading", { name: "example-org/omega-docs", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Deploy" })).toHaveCount(0);
  await expect(page.locator('[data-tab="production"]')).toHaveCount(0);
});
