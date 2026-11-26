import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { expectFieldHelp } from "./field-help.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { waitForRepositoryList } from "./submit-repository.ts";

// The Repository field offers the repositories the token can read. Only this spec adds `zeta-picker-app`.
const PICKED = "example-org/zeta-picker-app";

test("a repository is found by a fragment of its name, picked, added and no longer offered", async ({ page }) => {
  await page.goto("/settings");
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
  await waitForRepositoryList(page);
  const field = page.getByLabel("Repository", { exact: true });
  // The field's hint is a "?" beside its label and stays the field's description.
  await expectFieldHelp(page, {
    button: page.getByRole("button", { name: "Help: Repository" }),
    text: "The list shows the repositories COCKPIT's access token can read. A repository missing here has to be added to the token first.",
    describes: page.getByRole("combobox", { name: "Repository", exact: true }),
  });
  await field.click();
  await field.pressSequentially("picker");
  const options = page.getByRole("option");
  await expect(options).toHaveText([PICKED]);
  await options.first().click();
  await expect(field).toHaveValue(PICKED);
  await page.getByRole("region", { name: "Watched repositories" }).getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByRole("status")).toContainText(`${PICKED} is now watched.`);

  await page.reload();
  await waitForRepositoryList(page);
  await field.click();
  await field.pressSequentially("picker");
  await expect(page.getByText("No readable repository matches.")).toBeVisible();
});

test("Enter with nothing highlighted adds the name as typed", async ({ page }) => {
  await page.goto("/settings");
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
  await waitForRepositoryList(page);
  const field = page.getByLabel("Repository", { exact: true });
  await field.fill("example-org/no-such-app");
  await field.press("Escape");
  await field.press("Enter");
  await expect(page.getByRole("status")).toContainText("No access token finds this repository.");
});
