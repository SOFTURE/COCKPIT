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

/**
 * Waits until nothing that moves the footer is animating: the footer, an ancestor (the phone's sheet sliding in) or a
 * descendant. Animations elsewhere are not waited for: the header's Refresh icon spins for as long as any spec's scan
 * runs on the shared database.
 */
async function waitForFooterAnimations(page: Page) {
  const footer = await page.locator('[data-sidebar="footer"]:visible').elementHandle();
  await page.waitForFunction(
    (element) =>
      element !== null &&
      document.getAnimations().every((animation) => {
        const target = animation.effect instanceof KeyframeEffect ? animation.effect.target : null;
        const movesFooter = target !== null && (target.contains(element) || element.contains(target));
        return !movesFooter || animation.playState !== "running";
      }),
    footer,
  );
}

async function expectFooterAligned(page: Page) {
  await expect(page.locator('[data-sidebar="footer"]:visible button', { hasText: "Log out" })).toBeVisible();
  await waitForFooterAnimations(page);
  expect(Math.abs(await getLogoutOffset(page))).toBeLessThanOrEqual(1);
}

test("on a desktop the sidebar's Log out starts at the same left edge as the signed-in line", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await signIn(page);
  await expectFooterAligned(page);
});

test("on a desktop the footer is measured while a scan spins the header's Refresh icon", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  // Every progress poll of this page answers "running", so the Refresh icon spins for the rest of the test whatever
  // the shared database's scans do: an infinite animation outside the footer.
  await page.route("**/api/scan-progress", (route) =>
    route.fulfill({ json: { kind: "running", done: null, total: null, lastRead: null } }),
  );
  await signIn(page);
  const refresh = page.getByRole("button", { name: "Refresh", exact: true });
  // A scan another spec started may already have disabled (and spun) the button: forced, the click then does nothing,
  // and the routed poll keeps that scan "running" all the same.
  await refresh.click({ force: true });
  await expect(refresh.locator("svg")).toHaveClass(/animate-spin/);
  await expectFooterAligned(page);
});

test("on a phone the sidebar sheet's Log out starts at the same left edge as the signed-in line", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await page.getByRole("button", { name: "Toggle sidebar" }).click();
  await expectFooterAligned(page);
});
