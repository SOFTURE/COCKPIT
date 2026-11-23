import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";

// Shares the database with the other specs: it adds repositories no other spec uses and looks only at them.
test.describe.configure({ mode: "serial" });

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("Scan now reads a project and shows another's failure with its reason", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of ["example-org/zeta-app", "example-org/epsilon-app"]) {
    await page.getByLabel("Repository").fill(name);
    await page.getByRole("button", { name: "Add" }).click();
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }

  await page.getByRole("link", { name: "Scan status" }).click();
  await expect(page.getByRole("heading", { name: "Scan status", level: 1 })).toBeVisible();
  await page.getByRole("button", { name: "Scan now" }).click();

  const list = page.getByRole("list", { name: "Projects by last read" });
  const zeta = list.getByRole("listitem").filter({ hasText: "example-org/zeta-app" });
  const epsilon = list.getByRole("listitem").filter({ hasText: "example-org/epsilon-app" });
  // FR-3: a scan starts within 10 seconds of Scan now; the page refreshes itself while it runs.
  await expect(zeta).toContainText("Read", { timeout: 10_000 });
  await expect(zeta).toContainText(/Read \w{3} \d+, \d{4}/);
  await expect(epsilon).toContainText("State invalid", { timeout: 10_000 });
  await expect(epsilon).toContainText("does not match the state contract");
  await expect(page.getByText("Last scan finished")).toBeVisible({ timeout: 10_000 });
});
