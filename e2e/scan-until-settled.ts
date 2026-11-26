import type { Page } from "@playwright/test";
import { expect, test } from "@softure-ai/testing/playwright";

/** What a project's row on the overview says once a scan read it. */
export const READ_AT = /Read \w{3} \d+, \d{4}/;

/** What a project's row on Scan status says once a scan checked it: its "Read" badge says the rest (CT-24). */
export const CHECKED_AT = /Checked \w{3} \d+, \d{4}/;

/** How long one scan has to settle the rows (FR-3: a scan starts within 10 seconds of Scan now). */
const SCAN_SETTLE_MS = 10_000;
/** How long the presses of Scan now may take together. */
const SCAN_RETRY_MS = 40_000;

/**
 * Presses Scan now until every named project's row on Scan status shows what it expects, `CHECKED_AT` for a plain list.
 *
 * The specs share one database and scan it in parallel. Since @softure-ai/jobs 0.1.15 a press of Scan now while a scan
 * runs queues one follow-up scan behind it (SOFTURE/AI#1454), and every later press joins that follow-up, so a press
 * after this spec added its repositories is read by the follow-up. The retry stays as a guard for a press that joined
 * a pending run that listed the repositories before they were added.
 */
export async function scanUntilSettled(page: Page, expected: readonly string[] | Readonly<Record<string, string | RegExp>>): Promise<void> {
  const rows: readonly (readonly [string, string | RegExp])[] = isNameList(expected) ? expected.map((name) => [name, CHECKED_AT] as const) : Object.entries(expected);
  test.info().setTimeout(test.info().timeout + SCAN_RETRY_MS);
  await page.goto("/scan-status");
  // The rows sit in the owner's project groups (CT-35): every group's list inside the Projects card.
  const list = page.getByRole("region", { name: "Projects", exact: true });
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
