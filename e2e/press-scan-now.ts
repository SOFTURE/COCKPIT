import type { Page } from "@playwright/test";
import { expect } from "@softure-ai/testing/playwright";

/**
 * Presses Scan now and waits until the page shows its answer: from then on the page refreshes itself while the scan is
 * pending. The answer arriving is not enough: until React renders it the page still shows the state before the press.
 * The button stays disabled from the press until that render.
 */
export async function pressScanNow(page: Page) {
  const button = page.getByRole("button", { name: "Scan now" });
  const answered = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === "/scan-status");
  await button.click();
  await answered;
  await expect(button).toBeEnabled();
}
