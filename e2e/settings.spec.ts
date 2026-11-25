import { authMessages } from "@softure-ai/auth";
import type { Page } from "@playwright/test";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { expectFieldHelp } from "./field-help.ts";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";

// The Settings screen as grouped cards: each section a region with its heading and its actions as buttons.
async function openSettings(page: Page) {
  await page.goto("/settings");
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
  await expect(page.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
}

test("every section is a card with its own actions", async ({ page }) => {
  await openSettings(page);
  const repositories = page.getByRole("region", { name: "Watched repositories" });
  await expect(repositories.getByRole("link", { name: "Scan status" })).toBeVisible();
  await expect(repositories.getByRole("combobox", { name: "Repository", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Team" }).getByRole("link", { name: "Manage the team" })).toBeVisible();
  const account = page.getByRole("region", { name: "Account" });
  await expect(account.getByRole("link", { name: "Change password" })).toHaveAttribute("href", "/account/password");
  await expect(account.getByRole("link", { name: "Manage tokens" })).toHaveAttribute("href", "/account/mcp");
  await expect(account.getByRole("button", { name: "Log out" })).toBeVisible();
});

test("each setting explains itself in a \"?\" beside its title", async ({ page }) => {
  await openSettings(page);
  const account = page.getByRole("region", { name: "Account" });
  const settings = [
    { title: "Password", text: "The password you sign in with." },
    { title: "Assistant access (MCP)", text: "Tokens that let an assistant or the terminal read COCKPIT." },
    { title: "Session", text: "Sign out of COCKPIT on this device." },
  ];
  for (const { title, text } of settings) {
    const row = account.getByRole("listitem").filter({ has: page.getByRole("heading", { name: title, exact: true }) });
    // The hint is no longer a visible line under the title.
    await expect(row.locator("p")).toHaveCount(0);
    await expectFieldHelp(page, { button: row.getByRole("button", { name: `Help: ${title}` }), text, describes: row });
  }
});

test("the account actions line up in one column on a desktop", async ({ page }) => {
  await openSettings(page);
  const account = page.getByRole("region", { name: "Account" });
  const boxes = await Promise.all(
    [account.getByRole("link", { name: "Change password" }), account.getByRole("link", { name: "Manage tokens" }), account.getByRole("button", { name: "Log out" })].map(
      async (action) => action.boundingBox(),
    ),
  );
  const heights = boxes.map((box) => box?.height);
  const rightEdges = boxes.map((box) => (box === null ? null : Math.round(box.x + box.width)));
  expect(new Set(heights).size).toBe(1);
  expect(new Set(rightEdges).size).toBe(1);
});

test("log out signs the owner out", async ({ page }) => {
  await openSettings(page);
  await page.getByRole("region", { name: "Account" }).getByRole("button", { name: "Log out" }).click();
  await page.goto("/settings");
  await expect(page.getByLabel("Email")).toBeVisible();
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the cards fit the screen without a horizontal scroll", async ({ page }) => {
    await openSettings(page);
    await expect(page.getByRole("region", { name: "Account" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
