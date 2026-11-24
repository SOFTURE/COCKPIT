import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";

// FR-17: health from the projects' observability backend (the fake Grafana of e2e/fake-forge.ts). Shares the
// database with the other specs: it watches repositories no other spec uses and looks only at their rows.
test.describe.configure({ mode: "serial" });

const PROJECTS = ["example-org/upsilon-app", "example-org/phi-app", "example-org/chi-app", "example-org/psi-app"] as const;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("after a scan an unhealthy project is broken, a healthy one says so, and one without a source shows nothing", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of PROJECTS) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
  await scanUntilSettled(page, PROJECTS);

  await page.goto("/projects");
  const upsilon = page.locator('[data-project="example-org/upsilon-app"]');
  await expect(page.getByRole("list", { name: "Projects: Broken", exact: true }).locator('[data-project="example-org/upsilon-app"]')).toHaveCount(1);
  await expect(upsilon).toContainText("Its observability backend reports alerts firing.");
  await expect(upsilon.locator('[data-health="unhealthy"]')).toHaveText("Unhealthy: 1 alert firing");
  await expect(upsilon.locator('[data-health="unhealthy"]')).toHaveAttribute("title", "Upsilon app silent");

  const phi = page.locator('[data-project="example-org/phi-app"]');
  await expect(page.getByRole("list", { name: "Projects: Idle", exact: true }).locator('[data-project="example-org/phi-app"]')).toHaveCount(1);
  await expect(phi.locator('[data-health="healthy"]')).toHaveText("Healthy");
  await expect(phi.locator('[data-health="healthy"]')).toHaveAttribute("data-tone", "green");

  // A source that fails shows unknown with the reason and does not make the project broken.
  const chi = page.locator('[data-project="example-org/chi-app"]');
  await expect(page.getByRole("list", { name: "Projects: Idle", exact: true }).locator('[data-project="example-org/chi-app"]')).toHaveCount(1);
  await expect(chi.locator('[data-health="unknown"]')).toHaveText("Health unknown");
  await expect(chi.locator('[data-health="unknown"]')).toHaveAttribute("title", /None of its alert rules is in the observability backend/);

  // No rules file: nothing extra, status computed as before.
  await expect(page.locator('[data-project="example-org/psi-app"]')).toHaveCount(1);
  await expect(page.locator('[data-project="example-org/psi-app"] [data-health]')).toHaveCount(0);

  await page.goto("/projects/example-org/upsilon-app?tab=production");
  const details = page.getByRole("region", { name: "Health" });
  await expect(details.locator('[data-health="unhealthy"]')).toHaveText("Unhealthy: 1 alert firing");
  await expect(details).toContainText("Upsilon app silent");
  await page.goto("/projects/example-org/psi-app");
  await expect(page.getByRole("heading", { name: "example-org/psi-app", level: 1 })).toBeVisible();
  await expect(page.getByRole("region", { name: "Health" })).toHaveCount(0);
  await expect(page.locator('[data-tab="production"]')).toHaveCount(0);
});
