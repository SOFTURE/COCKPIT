import { expect, test } from "@softure-ai/testing/playwright";

// Without a session: the login page and a fresh bookmark must show the icon too.
test("the login page links the tab and home screen icons, and both load without a session", async ({ page, request }) => {
  await page.goto("/login");
  const iconHref = await page.locator('head link[rel="icon"]').first().getAttribute("href");
  const appleIconHref = await page.locator('head link[rel="apple-touch-icon"]').first().getAttribute("href");
  expect(iconHref).toMatch(/^\/icon\b/);
  expect(appleIconHref).toMatch(/^\/apple-icon\b/);

  for (const href of [iconHref, appleIconHref]) {
    const response = await request.get(href ?? "", { maxRedirects: 0 });
    expect(response.status(), href ?? "").toBe(200);
    expect(response.headers()["content-type"], href ?? "").toBe("image/png");
  }
});
