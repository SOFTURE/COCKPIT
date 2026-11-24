import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";
import { submitRepository } from "./submit-repository.ts";

// CT-3: context drift against the forge (the fake forge of e2e/fake-forge.ts publishes v3.2.0 on 2026-11-20 for all
// three). Shares the database with the other specs: it watches repositories no other spec uses.
test.describe.configure({ mode: "serial" });

const PROJECTS = ["example-org/drift-released-app", "example-org/drift-finished-app", "example-org/drift-settled-app"] as const;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("a release not settled and a finished roadmap still live are flagged, a settled project is not", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of PROJECTS) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
  await scanUntilSettled(page, PROJECTS);

  await page.goto("/projects");
  const released = page.locator('[data-project="example-org/drift-released-app"] [data-drift]');
  await expect(released).toHaveText("Release v3.2.0 not settled");
  await expect(released).toHaveAttribute("title", /Settles it: wt-roadmap\.py released v3\.2\.0/);
  await expect(page.locator('[data-project="example-org/drift-finished-app"] [data-drift]')).toHaveText("Finished roadmap still live");
  await expect(page.locator('[data-project="example-org/drift-settled-app"] [data-drift]')).toHaveCount(0);

  await page.goto("/projects/example-org/drift-released-app");
  const notice = page.getByRole("region", { name: "The context drifts from the forge" });
  await expect(notice.locator('[data-drift="release_not_settled"]')).toContainText("v3.2.0 was published 2026-11-20, after DR-2 merged");
  await expect(notice.locator('[data-drift="release_not_settled"]')).toContainText("wt-roadmap.py released v3.2.0");

  await page.goto("/projects/example-org/drift-finished-app?tab=roadmaps");
  await expect(page.getByRole("region", { name: "The context drifts from the forge" }).locator('[data-drift="finished_roadmap_live"]')).toContainText(
    "close the roadmap (softure-roadmap)",
  );

  await page.goto("/projects/example-org/drift-settled-app");
  await expect(page.locator("[data-drift-notice]")).toHaveCount(0);
});
