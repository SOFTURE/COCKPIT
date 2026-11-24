import type { Page } from "@playwright/test";
import { expect, test } from "@softure-ai/testing/playwright";

/** What a project's row on Scan status says once a scan read it. */
export const READ_AT = /Read \w{3} \d+, \d{4}/;

/** How long one scan has to settle the rows (FR-3: a scan starts within 10 seconds of Scan now). */
const SCAN_SETTLE_MS = 10_000;
/** How long the presses of Scan now may take together. */
const SCAN_RETRY_MS = 40_000;

/**
 * Presses Scan now until every named project's row on Scan status shows what it expects, `READ_AT` for a plain list.
 *
 * The specs share one database and scan it in parallel, and a press of Scan now (or adding a repository) joins a scan
 * that is already running (`runScheduleNow` in @softure-ai/jobs dedups on pending and running jobs). A scan that
 * listed the watched repositories before this spec added its own never reads them, so one press is not always enough:
 * the next press, after that scan ends, queues a run that reads them (SOFTURE/AI#1454).
 */
export async function scanUntilSettled(page: Page, expected: readonly string[] | Readonly<Record<string, string | RegExp>>): Promise<void> {
  const rows: readonly (readonly [string, string | RegExp])[] = isNameList(expected) ? expected.map((name) => [name, READ_AT] as const) : Object.entries(expected);
  test.info().setTimeout(test.info().timeout + SCAN_RETRY_MS);
  await page.goto("/scan-status");
  const list = page.getByRole("list", { name: "Projects by last read" });
  await expect(async () => {
    await page.getByRole("button", { name: "Scan now" }).click();
    for (const [name, text] of rows) {
      await expect(list.getByRole("listitem").filter({ hasText: name })).toContainText(text, { timeout: SCAN_SETTLE_MS });
    }
  }).toPass({ intervals: [1_000], timeout: SCAN_RETRY_MS });
}

function isNameList(expected: readonly string[] | Readonly<Record<string, string | RegExp>>): expected is readonly string[] {
  return Array.isArray(expected);
}
