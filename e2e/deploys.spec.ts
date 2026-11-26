import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { expectFieldHelp } from "./field-help.ts";
import { expectStateInRightColumn } from "./expect-row-state.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";
import { submitRepository } from "./submit-repository.ts";
import { expectListEntryRows } from "./expect-list-entry-rows.ts";
import { expectResultBadge } from "./expect-result-badge.ts";
import { captureEvidence } from "./capture-evidence.ts";

// CT-2: what waits for each app's next deploy (e2e/fake-forge.ts, the harbor apps). Shares the database with the
// other specs: it watches repositories no other spec uses and finds its rows by name, never by count.
test.describe.configure({ mode: "serial" });

const PROJECTS = ["example-org/harbor-app", "example-org/harbor-web", "example-org/harbor-api"] as const;

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

test("the Deploys page shows the changes merged since each release and warns of a new required secret", async ({ page }) => {
  await signIn(page, "/settings");
  for (const name of PROJECTS) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
  await scanUntilSettled(page, PROJECTS);

  await page.getByRole("link", { name: "Deploys" }).first().click();
  await expect(page).toHaveURL(/\/deploys$/);
  await expect(page.getByRole("heading", { name: "Deploys", level: 1 })).toBeVisible();
  // The harbor apps belong to no group (CT-35).
  const list = page.getByRole("list", { name: "Apps with a deploy workflow: No group", exact: true });

  // Up to date: nothing merged, no new secret.
  const upToDate = list.locator('[data-project="example-org/harbor-app"]');
  await expect(upToDate.locator("[data-deploy-release]")).toHaveText("Last release: v3.0.0");
  await expect(upToDate.locator('[data-deploy-production="known"]')).toHaveText("In production: v3.0.0");
  await expect(upToDate.locator('[data-deploy-result="passed"]')).toHaveText("Deploy passed");
  await expect(upToDate.locator('[data-deploy-result="passed"]')).toHaveAttribute("data-tone", "success");
  await expectResultBadge(page, upToDate, { attribute: ["data-deploy-result", "passed"], tone: "success", word: "Deploy passed" });
  await captureEvidence(page, { name: "11-deploys", target: () => list });
  // CT-19: the last deploy's result sits on top of the row's right column.
  await expectStateInRightColumn(page, upToDate, "Deploy passed");
  await expectListEntryRows(page, list, "26-deploys");
  await expect(upToDate.locator("[data-deploy-merged]")).toHaveText("Changes merged since v3.0.0: 0");
  await expect(upToDate.locator('[data-deploy-secrets="none"]')).toHaveText("No new required secrets since v3.0.0.");
  await expect(upToDate).toHaveAttribute("data-deploy-blocked", "false");

  // Three merged pull requests; a direct push is not one.
  const merged = list.locator('[data-project="example-org/harbor-web"]');
  await expect(merged.locator("[data-deploy-merged]")).toHaveText("Changes merged since v3.0.0: 3");
  await expect(merged).toHaveAttribute("data-deploy-blocked", "false");

  // The compose file gained a required secret: the deploy will stop at the secret check.
  const blocked = list.locator('[data-project="example-org/harbor-api"]');
  await expect(blocked).toHaveAttribute("data-deploy-blocked", "true");
  const secrets = blocked.locator('[data-deploy-secrets="added"]');
  await expect(secrets).toContainText("Will stop at the secret check");
  const secretList = secrets.getByRole("list", { name: "New required secrets" });
  await expect(secretList.getByRole("listitem")).toHaveText(["MAIL_KEY_SECRET"]);
  // The hint is a "?" beside the badge, and the list of names keeps it as its description.
  await expectFieldHelp(page, {
    button: secrets.getByRole("button", { name: "Help: Will stop at the secret check" }),
    text: "Required since v3.0.0. Check that each one is set in the production environment before the deploy.",
    describes: secretList,
  });

  // A project without a deploy workflow is not listed.
  await expect(list.locator('[data-project="example-org/omega-docs"]')).toHaveCount(0);

  // The row links to the project's page.
  await blocked.getByRole("link", { name: "example-org/harbor-api" }).click();
  await expect(page.getByRole("heading", { name: "example-org/harbor-api", level: 1 })).toBeVisible();
});
