// A result badge (CT-28) is theme-notion's ResultBadge: `data-slot="result-badge"`, its tone in `data-tone`, the screen's
// own `data-*` attribute, an icon and a word. At 1280 and 390 px it sits inside its row, never wider than the row,
// and the page never scrolls sideways: a long word truncates inside the badge, with the whole word on hover.
import type { Locator, Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";

const WIDTHS = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
] as const;

/** Half a pixel of rounding. */
const TOLERANCE = 0.5;

export interface ExpectedResultBadge {
  /** The screen's own attribute and its value, e.g. `["data-answer-state", "sent"]`. */
  readonly attribute: readonly [name: string, value: string];
  readonly tone: "success" | "warning" | "danger" | "muted" | "default";
  readonly word: string | RegExp;
}

export async function expectResultBadge(page: Page, row: Locator, expected: ExpectedResultBadge): Promise<void> {
  const [name, value] = expected.attribute;
  const badge = row.locator(`[data-slot=result-badge][${name}="${value}"]`);
  const original = page.viewportSize();
  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    await expect(badge).toHaveCount(1);
    await expect(badge).toHaveAttribute("data-tone", expected.tone);
    await expect(badge.locator("svg")).toHaveCount(1);
    await expect(badge.locator("[data-slot=result-badge-label]")).toHaveText(expected.word);
    await expect(badge).toHaveAttribute("title", /\S/);
    // A bounding box is read once and does not wait: the boxes are read again until the row has a layout.
    await expect(async () => {
      const [rowBox, badgeBox, overflow] = await Promise.all([
        row.boundingBox(),
        badge.boundingBox(),
        page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ]);
      if (rowBox === null || badgeBox === null) {
        throw new Error("The badge has no layout yet");
      }
      expect(badgeBox.x).toBeGreaterThanOrEqual(rowBox.x - TOLERANCE);
      expect(badgeBox.x + badgeBox.width).toBeLessThanOrEqual(rowBox.x + rowBox.width + TOLERANCE);
      // The page never scrolls sideways because of a badge.
      expect(overflow).toBeLessThanOrEqual(0);
    }).toPass();
  }
  if (original !== null) {
    await page.setViewportSize(original);
  }
}
