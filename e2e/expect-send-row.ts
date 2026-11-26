// A Broadcast project row's right column (CT-23): line 1 the send state and its fires; line 2 one inline control and,
// when the row has more to do, the row menu's button after it, on one line, never wrapped. At 1280 px the column stands
// beside the project's name; at 390 px it may wrap under it, still right-aligned, its controls touch-sized.
import type { Locator, Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";
import { TOUCH_TARGET_PX } from "./expect-touch-target.ts";

const WIDTHS = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
] as const;

/** The row's side padding (`px-2`) and half a pixel of rounding. */
const EDGE_TOLERANCE = 8.5;

export interface SendRowLayout {
  /** The one control on the row itself. */
  readonly inline: (actions: Locator) => Locator;
  /** Whether the row menu's button follows it. */
  readonly hasMenu: boolean;
}

export async function expectSendRowLayout(page: Page, row: Locator, { inline, hasMenu }: SendRowLayout): Promise<void> {
  const original = page.viewportSize();
  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    const status = row.locator("[data-slot=list-entry-status]");
    const actions = row.locator("[data-slot=list-entry-actions]");
    const control = inline(actions);
    const menuButton = actions.locator("[data-slot=row-actions-menu-trigger]");
    // One inline control, plus the menu's button when the row has more: nothing else on the line.
    await expect(actions.locator("a, button")).toHaveCount(hasMenu ? 2 : 1);
    await expect(control).toHaveCount(1);
    await expect(menuButton).toHaveCount(hasMenu ? 1 : 0);
    // A bounding box is read once and does not wait: the boxes are read again until the row has a layout.
    await expect(async () => {
      const [rowBox, identityBox, statusBox, actionsBox, controlBox, menuBox] = await Promise.all([
        row.boundingBox(),
        row.locator("[data-slot=list-entry-identity]").boundingBox(),
        status.boundingBox(),
        actions.boundingBox(),
        control.boundingBox(),
        hasMenu ? menuButton.boundingBox() : Promise.resolve(null),
      ]);
      if (rowBox === null || identityBox === null || statusBox === null || actionsBox === null || controlBox === null || (hasMenu && menuBox === null)) {
        throw new Error("The broadcast project row has no layout yet");
      }
      const rowRight = rowBox.x + rowBox.width;
      const last = menuBox ?? controlBox;
      // Both lines end at the row's right edge.
      expect(rowRight - (statusBox.x + statusBox.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);
      expect(rowRight - (last.x + last.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);
      // Line 2 under line 1.
      expect(actionsBox.y).toBeGreaterThanOrEqual(statusBox.y + statusBox.height - 0.5);
      if (menuBox !== null) {
        // The inline control and the menu's button on one line, the menu after the control.
        expect(Math.abs(controlBox.y + controlBox.height / 2 - (menuBox.y + menuBox.height / 2))).toBeLessThanOrEqual(2);
        expect(menuBox.x).toBeGreaterThanOrEqual(controlBox.x + controlBox.width);
      }
      if (size.width === 1280) {
        // Beside the project's name, its first line level with the name.
        expect(statusBox.x).toBeGreaterThanOrEqual(identityBox.x + identityBox.width);
        expect(Math.abs(statusBox.y - identityBox.y)).toBeLessThanOrEqual(4);
      } else {
        expect(controlBox.height).toBeGreaterThanOrEqual(TOUCH_TARGET_PX);
        if (menuBox !== null) {
          expect(menuBox.height).toBeGreaterThanOrEqual(TOUCH_TARGET_PX);
        }
      }
    }).toPass();
  }
  if (original !== null) {
    await page.setViewportSize(original);
  }
}
