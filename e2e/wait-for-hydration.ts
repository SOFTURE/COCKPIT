import type { Locator } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";

/**
 * Waits until React has hydrated the element: text typed into a server-rendered form before that can be lost to the
 * hydration, and an empty required field then blocks the submit. React marks every node it hydrates with its fiber.
 */
export async function waitForHydration(locator: Locator): Promise<void> {
  await expect
    .poll(() => locator.evaluate((element) => Object.keys(element).some((key) => key.startsWith("__reactFiber$"))))
    .toBe(true);
}
