// CT-25: a roadmap item is the theme's FoldRow with a right column: the status (pill, owner-step tag) on top and the
// row's control under it, right-aligned, beside the summary at 1280 px; below `md` (390 px) the column falls under the
// summary and the control is touch-sized.
import type { Locator, Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";
import { TOUCH_TARGET_PX } from "./expect-touch-target.ts";

const WIDTHS = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
] as const;

/** Half a pixel of rounding either way. */
const TOLERANCE = 1;

export async function expectFoldRowColumn(page: Page, row: Locator, { hasAction }: { readonly hasAction: boolean }): Promise<void> {
  const original = page.viewportSize();
  const summary = row.locator("[data-slot=fold-row-summary]");
  const status = row.locator("[data-slot=fold-row-actions] > [data-slot=fold-row-status]");
  const actions = row.locator("[data-slot=fold-row-actions] > [data-slot=fold-row-action-list]");
  await expect(status.locator("[data-stage]")).toHaveCount(1);
  await expect(actions).toHaveCount(hasAction ? 1 : 0);
  await expect(row.locator("[data-row-bar], [data-row-side], [data-row-status], [data-action-place], [data-row-action]")).toHaveCount(0);
  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    // A bounding box is read once and does not wait, so the boxes are read again until the row has its layout.
    await expect(async () => {
      const [summaryBox, statusBox, actionBox] = await Promise.all([
        summary.boundingBox(),
        status.boundingBox(),
        hasAction ? actions.locator("a, button").first().boundingBox() : Promise.resolve(null),
      ]);
      if (summaryBox === null || statusBox === null || (hasAction && actionBox === null)) {
        throw new Error("The item row's summary, status or control is not drawn");
      }
      if (size.width === 1280) {
        // Beside the summary, on its first line (`align="start"`), within its height.
        expect(statusBox.x).toBeGreaterThanOrEqual(summaryBox.x + summaryBox.width - TOLERANCE);
        expect(Math.abs(statusBox.y - summaryBox.y)).toBeLessThanOrEqual(4);
        expect(statusBox.y).toBeGreaterThanOrEqual(summaryBox.y - TOLERANCE);
        expect(statusBox.y + statusBox.height).toBeLessThanOrEqual(summaryBox.y + summaryBox.height + TOLERANCE);
      } else {
        // Under the summary.
        expect(statusBox.y).toBeGreaterThanOrEqual(summaryBox.y + summaryBox.height - TOLERANCE);
      }
      if (actionBox !== null) {
        if (size.width === 1280) {
          // Under the status, the right edges aligned, still beside the summary.
          expect(actionBox.y).toBeGreaterThanOrEqual(statusBox.y + statusBox.height - TOLERANCE);
          expect(Math.abs(actionBox.x + actionBox.width - (statusBox.x + statusBox.width))).toBeLessThanOrEqual(TOLERANCE);
          expect(actionBox.x).toBeGreaterThanOrEqual(summaryBox.x + summaryBox.width - TOLERANCE);
          expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(summaryBox.y + summaryBox.height + TOLERANCE);
        } else {
          expect(actionBox.y).toBeGreaterThanOrEqual(summaryBox.y + summaryBox.height - TOLERANCE);
          expect(actionBox.height).toBeGreaterThanOrEqual(TOUCH_TARGET_PX);
        }
      }
    }).toPass();
  }
  if (original !== null) {
    await page.setViewportSize(original);
  }
}
