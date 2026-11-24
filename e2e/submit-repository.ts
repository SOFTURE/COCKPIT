import type { Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";
import { en } from "../messages/en.ts";
import type { AppMessages } from "../messages/index.ts";

type RepositoryCopy = AppMessages["repositories"];

/**
 * Waits until Settings shows the Repository field with the token's list. Until the list streams in, the page shows a
 * fallback field that the listed one then replaces, and text typed into the fallback is lost with it (#55).
 */
export async function waitForRepositoryList(page: Page, copy: RepositoryCopy = en.repositories): Promise<void> {
  await expect(page.getByPlaceholder(copy.searchPlaceholder)).toBeVisible({ timeout: 15_000 });
}

/** Types a repository into the Repository field on Settings and presses Add. */
export async function submitRepository(page: Page, name: string, copy: RepositoryCopy = en.repositories): Promise<void> {
  await waitForRepositoryList(page, copy);
  await page.getByRole("combobox", { name: copy.nameLabel, exact: true }).fill(name);
  await page.getByRole("button", { name: copy.add }).click();
}
