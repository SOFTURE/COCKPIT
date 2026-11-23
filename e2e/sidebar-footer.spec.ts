import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";

async function signIn(page: Page) {
  await page.goto("/inbox");
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

/**
 * How far the "Log out" text starts from the signed-in line's text, measured on the text itself (a button's padding
 * indents its text), both in one frame so a sheet still sliding in moves both alike.
 */
async function getLogoutOffset(page: Page): Promise<number> {
  return page.locator('[data-sidebar="footer"]:visible').evaluate((footer) => {
    const getTextLeft = (element: Element | null): number => {
      if (element === null) throw new Error("sidebar footer: an expected element is missing");
      const range = document.createRange();
      range.selectNodeContents(element);
      return range.getBoundingClientRect().left;
    };
    return getTextLeft(footer.querySelector("button")) - getTextLeft(footer.querySelector("p"));
  });
}

async function expectFooterAligned(page: Page) {
  await expect(page.locator('[data-sidebar="footer"]:visible button', { hasText: "Log out" })).toBeVisible();
  await page.waitForFunction(() => document.getAnimations().every((animation) => animation.playState !== "running"));
  expect(Math.abs(await getLogoutOffset(page))).toBeLessThanOrEqual(1);
}

test("on a desktop the sidebar's Log out starts at the same left edge as the signed-in line", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page);
  await expectFooterAligned(page);
});

test("on a phone the sidebar sheet's Log out starts at the same left edge as the signed-in line", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.getByRole("button", { name: "Toggle sidebar" }).click();
  await expectFooterAligned(page);
});
