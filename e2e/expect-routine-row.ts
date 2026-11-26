// A routine row's right column (CT-22): line 1 the last-call badge alone; line 2 the on/off switch and the row menu's
// button, side by side, never wrapped. At 1280 px the column stands beside what the row is; at 390 px it may wrap
// under it, still right-aligned, its controls touch-sized.
import type { Locator, Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";
import { TOUCH_TARGET_PX } from "./expect-touch-target.ts";

const WIDTHS = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
] as const;

/** The row's side padding (`px-2`) and half a pixel of rounding. */
const EDGE_TOLERANCE = 8.5;

export async function expectRoutineRowLayout(page: Page, row: Locator): Promise<void> {
  const original = page.viewportSize();
  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    const status = row.locator("[data-slot=list-entry-status]");
    const actions = row.locator("[data-slot=list-entry-actions]");
    // Nothing on the badge's line but the badge.
    await expect(status.locator(":scope > *")).toHaveCount(1);
    await expect(status.locator(":scope > [data-last-call-badge]")).toHaveCount(1);
    await expect(row.locator("[data-routine-state]")).toHaveCount(0);
    await expect(row.locator("[data-last-call]")).toHaveCount(0);
    const switchControl = actions.getByRole("switch");
    const menuButton = actions.locator("[data-slot=row-actions-menu-trigger]");
    // The switch and the menu button, nothing else.
    await expect(actions.locator("button")).toHaveCount(2);
    // A bounding box is read once and does not wait: the boxes are read again until the row has a layout.
    await expect(async () => {
      const [rowBox, identityBox, statusBox, actionsBox, switchBox, menuBox] = await Promise.all([
        row.boundingBox(),
        row.locator("[data-slot=list-entry-identity]").boundingBox(),
        status.boundingBox(),
        actions.boundingBox(),
        switchControl.boundingBox(),
        menuButton.boundingBox(),
      ]);
      if (rowBox === null || identityBox === null || statusBox === null || actionsBox === null || switchBox === null || menuBox === null) {
        throw new Error("The routine row has no layout yet");
      }
      const rowRight = rowBox.x + rowBox.width;
      // Both lines end at the row's right edge.
      expect(rowRight - (statusBox.x + statusBox.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);
      expect(rowRight - (menuBox.x + menuBox.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);
      // Line 2 under line 1; the switch and the menu on one line, the menu after the switch.
      expect(actionsBox.y).toBeGreaterThanOrEqual(statusBox.y + statusBox.height - 0.5);
      expect(Math.abs(switchBox.y + switchBox.height / 2 - (menuBox.y + menuBox.height / 2))).toBeLessThanOrEqual(2);
      expect(menuBox.x).toBeGreaterThanOrEqual(switchBox.x + switchBox.width);
      if (size.width === 1280) {
        // Beside what the row is, its first line level with the name.
        expect(statusBox.x).toBeGreaterThanOrEqual(identityBox.x + identityBox.width);
        expect(Math.abs(statusBox.y - identityBox.y)).toBeLessThanOrEqual(4);
      } else {
        expect(menuBox.height).toBeGreaterThanOrEqual(TOUCH_TARGET_PX);
        expect(switchBox.height).toBeGreaterThanOrEqual(TOUCH_TARGET_PX);
      }
    }).toPass();
  }
  if (original !== null) {
    await page.setViewportSize(original);
  }
}
