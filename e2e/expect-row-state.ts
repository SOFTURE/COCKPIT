// The theme's list row (CT-18, CT-26): a row's state badge sits in its right column, with the row's actions on the same
// line to its right (app/row-layout.css), the line ending at the row's right edge; at 1280 px the column stands beside
// what the row is, at 390 px it may wrap under it.
import type { Locator, Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";
import { expectStateBesideControls } from "./expect-state-beside-controls.ts";

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
    const status = row.locator("[data-slot=list-entry-status]");
    await expect(status).toContainText(state);
    // A bounding box is read once and does not wait: the header's refresh re-renders the lists, so the boxes are read
    // again until the row has a layout.
    await expect(async () => {
      const [rowBox, sideBox, columnBox, statusBox, identityBox, actionsBox] = await Promise.all([
        row.boundingBox(),
        row.locator("[data-slot=list-entry-side]").boundingBox(),
        row.locator("[data-slot=list-entry-column]").boundingBox(),
        status.boundingBox(),
        row.locator("[data-slot=list-entry-identity]").boundingBox(),
        row.locator("[data-slot=list-entry-actions]").count().then((count) => (count === 0 ? null : row.locator("[data-slot=list-entry-actions]").boundingBox())),
      ]);
      if (rowBox === null || sideBox === null || columnBox === null || statusBox === null || identityBox === null) {
        throw new Error("The row has no layout yet");
      }
      // The line ends at the column's right edge (the state's on a row without controls, else the controls'); the
      // column (with the arrow after it on a row that opens something) ends at the row's.
      const lineEnd = actionsBox ?? statusBox;
      expect(Math.abs(columnBox.x + columnBox.width - (lineEnd.x + lineEnd.width))).toBeLessThanOrEqual(0.5);
      expect(rowBox.x + rowBox.width - (sideBox.x + sideBox.width)).toBeLessThanOrEqual(EDGE_TOLERANCE);
      if (size.width === 1280) {
        expect(statusBox.x).toBeGreaterThanOrEqual(identityBox.x + identityBox.width);
        expect(Math.abs(Math.min(statusBox.y, (actionsBox ?? statusBox).y) - identityBox.y)).toBeLessThanOrEqual(4);
      }
      if (actionsBox !== null) {
        expectStateBesideControls(statusBox, actionsBox, rowBox);
      }
    }).toPass();
  }
  if (original !== null) {
    await page.setViewportSize(original);
  }
}
