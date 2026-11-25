import type { Locator, Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";
import { waitForHydration } from "./wait-for-hydration.ts";

/**
 * Checks one field or setting hint shown as a "?" (CT-17): a tap on the button opens the tooltip with the hint, and
 * the element the hint explains still has it as its accessible description.
 */
export async function expectFieldHelp(page: Page, { button, text, describes }: {
  /** The "?" button, e.g. `getByRole("button", { name: "Help: Token" })`. */
  readonly button: Locator;
  readonly text: string;
  /** The element the hint explains. */
  readonly describes: Locator;
}): Promise<void> {
  await waitForHydration(button);
  await button.click();
  await expect(page.getByRole("tooltip")).toHaveText(text);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("tooltip")).toHaveCount(0);
  await expect(describes).toHaveAccessibleDescription(text);
}
