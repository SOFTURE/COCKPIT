// A list row's right column (CT-24): line 1 holds only state (badges, statuses), line 2 only controls. Every text in
// the column sits in a badge, a status or a control; no plain text, no link as a reference. Checked at 1280 and 390 px,
// where the column may wrap under what the row is, and the page never scrolls sideways.
import type { Locator, Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";

const WIDTHS = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
] as const;

/** What may carry words in the right column: a badge, a status, a control, or an answer being confirmed. */
const ALLOWED = '[data-slot="badge"], [data-slot="result-badge"], [data-slot="status"], button, [role="switch"], [data-row-wide]';

export async function expectSideHoldsStateAndControls(page: Page, row: Locator): Promise<void> {
  const original = page.viewportSize();
  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    await expect(row).toBeVisible();
    const stray = await row.evaluate((element, allowed) => {
      const side = element.querySelector(":scope > [data-row-side]");
      if (side === null) {
        return [];
      }
      const found: string[] = [];
      const walker = document.createTreeWalker(side, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
        const text = node.textContent?.trim() ?? "";
        if (text !== "" && node.parentElement?.closest(allowed) === null) {
          found.push(text);
        }
      }
      return found;
    }, ALLOWED);
    expect(stray, `plain text in the right column at ${String(size.width)} px`).toEqual([]);
    // Line 1 is state only; line 2 controls only.
    await expect(row.locator("[data-row-side] > [data-row-status]").locator("button, a")).toHaveCount(0);
    await expect(row.locator("[data-row-side] > [data-row-actions]").locator('[data-slot="badge"], [data-slot="result-badge"], [data-slot="status"]')).toHaveCount(0);
    await expect(row.locator("[data-row-side]").locator("a")).toHaveCount(0);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `sideways scroll at ${String(size.width)} px`).toBeLessThanOrEqual(0);
  }
  if (original !== null) {
    await page.setViewportSize(original);
  }
}
