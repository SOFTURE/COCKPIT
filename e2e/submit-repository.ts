import type { Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";
import { en } from "../messages/en.ts";
import type { AppMessages } from "../messages/index.ts";

type RepositoryCopy = AppMessages["repositories"];

/** Waits until the Repository field on Settings searches the token's list (for specs that pick from it). */
export async function waitForRepositoryList(page: Page, copy: RepositoryCopy = en.repositories): Promise<void> {
  await expect(page.getByPlaceholder(copy.searchPlaceholder)).toBeVisible({ timeout: 15_000 });
}

/** Types a repository into the Repository field on Settings and presses Add, as a person does: list or not. */
export async function submitRepository(page: Page, name: string, copy: RepositoryCopy = en.repositories): Promise<void> {
  await page.getByRole("combobox", { name: copy.nameLabel, exact: true }).fill(name);
  await page.getByRole("button", { name: copy.add }).click();
}
