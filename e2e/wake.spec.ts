import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";

// CV-2: what wakes each project on an owner-word issue, read from its `context/workflow.json` (the fake forge of
// e2e/fake-forge.ts). Shares the database with the other specs: it watches repositories no other spec uses.
test.describe.configure({ mode: "serial" });

const PROJECTS = ["example-org/wake-routine-app", "example-org/wake-heartbeat-app", "example-org/wake-quiet-app"] as const;
const SETUP_URL = "https://github.com/SOFTURE/SKILLS/blob/main/routines/cockpit-wake.md#setting-it-up";

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("three projects declaring routine, heartbeat and nothing show three different wake-ups", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of PROJECTS) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
  await scanUntilSettled(page, PROJECTS);

  await page.goto("/projects");
  await expect(page.locator('[data-project="example-org/wake-routine-app"] [data-wake]')).toHaveText("Wakes on its own");
  await expect(page.locator('[data-project="example-org/wake-heartbeat-app"] [data-wake]')).toHaveText("Wakes while a run works");
  await expect(page.locator('[data-project="example-org/wake-quiet-app"] [data-wake]')).toHaveText("Waits for its next run");
  await expect(page.locator('[data-project="example-org/wake-quiet-app"] [data-wake]')).toHaveAttribute("title", /autonomy\.cockpitWake/);

  // A project without a workflow file shows nothing extra.
  await expect(page.locator('[data-project="example-org/psi-app"] [data-wake]')).toHaveCount(0);

  await page.goto("/projects/example-org/wake-quiet-app?tab=waiting");
  const quiet = page.getByRole("region", { name: "Owner-word issues" });
  await expect(quiet.locator('[data-wake="undeclared"]')).toHaveText("Waits for its next run");
  await expect(quiet.getByRole("link", { name: "Set up the wake routine" })).toHaveAttribute("href", SETUP_URL);

  await page.goto("/projects/example-org/wake-routine-app?tab=waiting");
  const routine = page.getByRole("region", { name: "Owner-word issues" });
  await expect(routine.locator('[data-wake="routine"]')).toHaveText("Wakes on its own");
  await expect(routine.getByRole("link", { name: "Set up the wake routine" })).toHaveCount(0);
});
