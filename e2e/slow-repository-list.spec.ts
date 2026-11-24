import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { en } from "../messages/en.ts";
import { fillMessage } from "../messages/index.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";

// The "slow-list" project's server reads the token's repository list from a forge that answers it late, and only this
// spec uses that server, so its first Settings visit shows the field before the list arrives (#55).
const TYPED = "example-org/alpha-app";
const copy = en.repositories;

test("a name typed before the token's list arrives stays in the one field and adds", async ({ page }) => {
  await page.goto("/settings");
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
  const field = page.getByRole("combobox", { name: copy.nameLabel, exact: true });
  await expect(page.getByText(copy.loadingHint)).toBeVisible();
  await field.fill(TYPED);

  // The list arrives: the same field now searches it.
  await expect(page.getByText(copy.pickHint)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByPlaceholder(copy.searchPlaceholder)).toHaveCount(1);
  await expect(field).toHaveCount(1);
  await expect(field).toHaveValue(TYPED);

  await field.press("Escape");
  await page.getByRole("button", { name: copy.add }).click();
  await expect(page.getByRole("status")).toContainText(fillMessage(copy.added, { name: TYPED }));
});
