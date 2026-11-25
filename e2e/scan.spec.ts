import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { expectStateInRightColumn } from "./expect-row-state.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { READ_AT, scanUntilSettled } from "./scan-until-settled.ts";

// Shares the database with the other specs: it adds repositories no other spec uses and looks only at them.
test.describe.configure({ mode: "serial" });

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("Scan now reads a project and shows another's failure with its reason", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of ["example-org/zeta-app", "example-org/epsilon-app"]) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }

  await page.getByRole("link", { name: "Scan status" }).click();
  await expect(page.getByRole("heading", { name: "Scan status", level: 1 })).toBeVisible();
  // FR-3: a scan starts within 10 seconds of Scan now; the page refreshes itself while it runs.
  await scanUntilSettled(page, { "example-org/zeta-app": READ_AT, "example-org/epsilon-app": "State invalid" });
  const epsilon = page.getByRole("list", { name: "Projects by last read" }).getByRole("listitem").filter({ hasText: "example-org/epsilon-app" });
  await expect(epsilon).toContainText("does not match the state contract");
  await expectStateInRightColumn(page, epsilon, "State invalid");
  await expect(page.getByText("Last scan finished")).toBeVisible({ timeout: 10_000 });
});
