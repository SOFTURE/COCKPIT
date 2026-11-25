// The one list row (CT-18): a row's state badge sits on top of its right column, at the row's right edge, with the
// row's actions under it; at 1280 px the column stands beside what the row is, at 390 px it may wrap under it.
import type { Locator, Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";

const WIDTHS = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
] as const;

/** The row's side padding (`px-2`) and half a pixel of rounding. */
const EDGE_TOLERANCE = 8.5;

export async function expectStateInRightColumn(page: Page, row: Locator, state: string | RegExp): Promise<void> {
  const original = page.viewportSize();
  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    const status = row.locator("[data-row-side] > [data-row-status]");
    await expect(status).toContainText(state);
    // A bounding box is read once and does not wait: the header's refresh re-renders the lists, so the boxes are read
    // again until the row has a layout.
    await expect(async () => {
      const [rowBox, statusBox, identityBox, actionsBox] = await Promise.all([
        row.boundingBox(),
        status.boundingBox(),
        row.locator("[data-row-identity]").boundingBox(),
        row.locator("[data-row-side] > [data-row-actions]").count().then((count) => (count === 0 ? null : row.locator("[data-row-side] > [data-row-actions]").boundingBox())),
      ]);
      expect(rowBox).not.toBeNull();
      expect(statusBox).not.toBeNull();
      expect(identityBox).not.toBeNull();
      if (rowBox === null || statusBox === null || identityBox === null) {
        return;
      }
      expect(rowBox.x + rowBox.width - (statusBox.x + statusBox.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);
      if (size.width === 1280) {
        expect(statusBox.x).toBeGreaterThanOrEqual(identityBox.x + identityBox.width);
        expect(Math.abs(statusBox.y - identityBox.y)).toBeLessThanOrEqual(4);
      }
      if (actionsBox !== null) {
        expect(actionsBox.y).toBeGreaterThanOrEqual(statusBox.y + statusBox.height);
      }
    }).toPass();
  }
  if (original !== null) {
    await page.setViewportSize(original);
  }
}
