// CT-26: every list row in COCKPIT is the theme's `ListEntry` inside the theme's `ListItem`, in the theme's `List` at the
// roomy density. Photographs the list first for the change's evidence (with E2E_EVIDENCE_DIR set, see
// capture-evidence.ts), then checks every item of it.
import type { Locator, Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";
import { captureEvidence } from "./capture-evidence.ts";

/** How far the middles of a row's arrow and its right column may sit apart (half a pixel of rounding either way). */
const MIDDLE_TOLERANCE = 1;

export async function expectListEntryRows(page: Page, list: Locator, name: string): Promise<void> {
  await captureEvidence(page, { name, target: () => list });
  await expect(list).toHaveAttribute("data-slot", "list");
  await expect(list).toHaveAttribute("data-density", "roomy");
  const items = list.locator(":scope > li");
  await expect(items.first()).toBeVisible();
  const shapes = await items.evaluateAll((elements) =>
    elements.map((item) => {
      const [only, ...rest] = Array.from(item.children);
      return item.getAttribute("data-slot") === "list-item" && rest.length === 0 && only?.getAttribute("data-slot") === "list-entry";
    }),
  );
  expect(shapes.length).toBeGreaterThan(0);
  expect(shapes, "every item holds exactly one ListEntry").not.toContain(false);
  await expectArrowLevelWithColumn(items);
}

/**
 * COCKPIT's row standard (app/row-layout.css): in a row that opens a page and has a state or controls, the arrow and
 * the right column share one middle, so a trash can, a switch or a badge never sits lower than the arrow beside it.
 */
async function expectArrowLevelWithColumn(items: Locator): Promise<void> {
  const offsets = await items.evaluateAll((elements) =>
    elements.flatMap((item) => {
      const arrow = item.querySelector("[data-slot=list-entry-arrow]");
      const column = item.querySelector("[data-slot=list-entry-column]");
      if (arrow === null || column === null || column.querySelector("[data-row-wide]") !== null) {
        return [];
      }
      const arrowBox = arrow.getBoundingClientRect();
      const columnBox = column.getBoundingClientRect();
      return [Math.abs(arrowBox.top + arrowBox.height / 2 - (columnBox.top + columnBox.height / 2))];
    }),
  );
  for (const offset of offsets) {
    expect(offset, "the arrow and the row's state and controls sit on one middle").toBeLessThanOrEqual(MIDDLE_TOLERANCE);
  }
}
