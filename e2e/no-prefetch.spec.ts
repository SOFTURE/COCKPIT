import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";

// Every screen renders the whole app layout on the server; a page view that prefetched each sidebar link rendered it
// once per link and project, and kept the server busy behind every click.
test("a page view prefetches no other screen, and a click still opens it", async ({ page }) => {
  await page.goto("/broadcast");
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
  const prefetches: string[] = [];
  page.on("request", (request) => {
    if (request.headers()["next-router-prefetch"] !== undefined) {
      prefetches.push(new URL(request.url()).pathname);
    }
  });

  await page.goto("/broadcast");
  await expect(page.getByRole("heading", { level: 1, name: "Broadcast" })).toBeVisible();
  await page.getByRole("list", { name: "Main" }).getByRole("link", { name: "Inbox" }).hover();
  await page.waitForLoadState("networkidle");
  expect(prefetches).toEqual([]);

  await page.getByRole("list", { name: "Main" }).getByRole("link", { name: "Inbox" }).click();
  await expect(page).toHaveURL(/\/inbox$/);
  await expect(page.getByRole("heading", { level: 1, name: "Inbox" })).toBeVisible();
  expect(prefetches).toEqual([]);
});
