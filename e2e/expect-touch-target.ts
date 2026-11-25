import type { Locator } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";

/** The smallest height a control may have on a phone (WCAG 2.5.5). */
export const TOUCH_TARGET_PX = 44;

/**
 * Asserts a control is at least touch-sized. A bounding box is read once and does not wait, so a box read while the
 * page is still settling (CI under load) comes back null; polling it makes the check a web-first assertion.
 */
export async function expectTouchTarget(control: Locator): Promise<void> {
  await expect.poll(async () => (await control.boundingBox())?.height ?? 0).toBeGreaterThanOrEqual(TOUCH_TARGET_PX);
}
