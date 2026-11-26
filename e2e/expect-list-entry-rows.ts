// CT-26: every list row in COCKPIT is the theme's `ListEntry` inside the theme's `ListItem`, in the theme's `List` at the
// roomy density. Photographs the list first for the change's evidence (with E2E_EVIDENCE_DIR set, see
// capture-evidence.ts), then checks every item of it.
import type { Locator, Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";
import { captureEvidence } from "./capture-evidence.ts";

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
}
