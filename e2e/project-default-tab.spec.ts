import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { captureEvidence } from "./capture-evidence.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";

// CT-29: a project's page opened without `?tab=` shows Waiting, whatever the project reports. Shares the database with
// the other specs: it watches repositories no other spec uses and looks only at their pages.
test.describe.configure({ mode: "serial" });

const PRODUCTION_ONLY = "example-org/tab-production-app";
const WORK_ONLY = "example-org/tab-work-app";
const WITH_ENTRIES = "example-org/tab-entries-app";
const PROJECTS = [PRODUCTION_ONLY, WORK_ONLY, WITH_ENTRIES] as const;
const WIDTHS = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
] as const;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

function tab(page: Page, key: string) {
  return page.getByRole("navigation", { name: "Sections of this project" }).locator(`[data-tab="${key}"]`);
}

async function expectOpensOnWaiting(page: Page, project: string, entries: "none" | "some") {
  await page.goto(`/projects/${project}`);
  await expect(page.getByRole("heading", { name: project, level: 1 })).toBeVisible();
  await expect(page).toHaveURL(new RegExp(`/projects/${project}$`));
  await expect(tab(page, "waiting")).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("navigation", { name: "Sections of this project" }).locator('[aria-current="page"]')).toHaveCount(1);
  const waiting = page.getByRole("region", { name: "Waiting for you" });
  await expect(waiting).toBeVisible();
  if (entries === "none") {
    await expect(waiting).toContainText("Nothing in this project waits for you.");
  } else {
    await expect(waiting.getByRole("list", { name: "Entries of this project waiting for you" }).getByRole("listitem")).toHaveCount(1);
  }
  await expect(page.getByRole("region", { name: "Deploy" })).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Active roadmap" })).toHaveCount(0);
}

test("a project's page opens on Waiting whatever the project reports", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of PROJECTS) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
  await scanUntilSettled(page, PROJECTS);

  // The owner's case: production data, nothing waiting.
  await page.goto(`/projects/${PRODUCTION_ONLY}`);
  await expect(tab(page, "production")).toHaveCount(1);
  await captureEvidence(page, { name: "01-project-page-without-tab", target: (current) => current.locator("main") });

  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    await expect(tab(page, "production")).toHaveCount(1);
    await expectOpensOnWaiting(page, PRODUCTION_ONLY, "none");
    await expectOpensOnWaiting(page, WORK_ONLY, "none");
    await expect(tab(page, "roadmaps").locator('[data-slot="tab-bar-count"]')).toHaveText("1");
    await expect(tab(page, "changes").locator('[data-slot="tab-bar-count"]')).toHaveText("1");
    await expectOpensOnWaiting(page, WITH_ENTRIES, "some");
  }

  // A named tab still opens that tab.
  await page.goto(`/projects/${PRODUCTION_ONLY}?tab=production`);
  await expect(tab(page, "production")).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("region", { name: "Deploy" }).locator('[data-deploy-version="production"]')).toHaveText("v1.4.0");
  // An unavailable one falls back to Waiting.
  await page.goto(`/projects/${WORK_ONLY}?tab=production`);
  await expect(tab(page, "waiting")).toHaveAttribute("aria-current", "page");
});
