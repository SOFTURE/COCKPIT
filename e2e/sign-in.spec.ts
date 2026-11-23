import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";

const copy = authMessages.en;

test("the owner signs in and lands on the empty inbox inside the shell", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/login/);
  await submitLogin(page, { copy, email: OWNER_EMAIL, password: OWNER_PASSWORD });
  await expect(page).toHaveURL(/\/inbox$/);
  await expect(page.getByRole("heading", { name: "Inbox", level: 1 })).toBeVisible();
  await expect(page.getByText("Nothing waits for you")).toBeVisible();
  const navigation = page.getByRole("list", { name: "Main" });
  await expect(navigation.getByRole("link")).toHaveText(["Inbox", "Projects", "Settings"]);
});

test("a visitor without a session reaches only the login page", async ({ page, request }) => {
  for (const path of ["/inbox", "/projects", "/settings"]) {
    await page.goto(path);
    await expect(page).toHaveURL(new RegExp(`/login\\?next=${encodeURIComponent(path).replace(/\//g, "%2F")}`));
  }
  const api = await request.get("/api/projects", { maxRedirects: 0 });
  expect([302, 303, 307, 401, 404]).toContain(api.status());
});

test("nobody can sign up", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByLabel(copy.fields.email)).toHaveCount(0);
  await expect(page.getByText(copy.register.closedTitle)).toBeVisible();
});

test("the health endpoint answers ok without a session", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: "ok" });
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the inbox has no horizontal scroll", async ({ page }) => {
    await page.goto("/login");
    await submitLogin(page, { copy, email: OWNER_EMAIL, password: OWNER_PASSWORD });
    await expect(page).toHaveURL(/\/inbox$/);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
