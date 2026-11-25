import { mkdir } from "node:fs/promises";
import path from "node:path";
import type { Locator, Page } from "@playwright/test";

const WIDTHS = [
  { width: 1280, height: 900 },
  { width: 390, height: 844 },
] as const;

export interface CaptureOptions {
  /** The file name's start, e.g. `01-row-new`; the width, theme and `-<stage>` are added. */
  readonly name: string;
  /** What to photograph once the page is at the size and theme. */
  readonly target: (page: Page) => Locator;
  /** Run before each photograph, once the size and theme are set (e.g. open a menu). */
  readonly prepare?: (page: Page) => Promise<void>;
}

/**
 * With E2E_EVIDENCE_DIR set, photographs one part of the current page at 1280 and 390 px in light and dark, as
 * `<name>-<stage>-<width>-<theme>.png` (E2E_EVIDENCE_STAGE, `after` by default). Without it, does nothing.
 */
export async function captureEvidence(page: Page, { name, target, prepare }: CaptureOptions): Promise<void> {
  const evidenceDir = process.env.E2E_EVIDENCE_DIR;
  if (evidenceDir === undefined) {
    return;
  }
  const stage = process.env.E2E_EVIDENCE_STAGE ?? "after";
  await mkdir(evidenceDir, { recursive: true });
  const viewport = page.viewportSize();
  for (const size of WIDTHS) {
    await page.setViewportSize(size);
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await page.mouse.move(0, 0);
      await prepare?.(page);
      await target(page).screenshot({ path: path.join(evidenceDir, `${name}-${stage}-${String(size.width)}-${colorScheme}.png`), animations: "disabled" });
      if (prepare !== undefined) {
        await page.keyboard.press("Escape");
      }
    }
  }
  if (viewport !== null) {
    await page.setViewportSize(viewport);
  }
  await page.emulateMedia({ colorScheme: "light" });
}
