import type { Page } from "@playwright/test";

/** Presses Scan now and waits for its answer: from then on the page refreshes itself while the scan is pending. */
export async function pressScanNow(page: Page) {
  const answered = page.waitForResponse((response) => response.request().method() === "POST" && new URL(response.url()).pathname === "/scan-status");
  await page.getByRole("button", { name: "Scan now" }).click();
  await answered;
}
