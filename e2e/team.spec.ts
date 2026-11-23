import type { Browser, Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, openPageAsNewClient, submitLogin, test } from "@softure-ai/testing/playwright";
import { FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD, TEAMMATE_EMAIL, TEAMMATE_PASSWORD } from "./fixtures.ts";

// Teammates (FR-16). Shares the database with the other specs: it watches a repository no other spec uses, invites an
// address no other spec uses, and is the only spec that signs in as the teammate (and removes them at the end).
test.describe.configure({ mode: "serial" });

const REPOSITORY = "example-org/omicron-app";
const ENTRY_TEXT = "Approve the omicron-app onboarding copy";

async function signInAs(page: Page, path: string, email: string, password: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email, password });
}

async function openAs(browser: Browser, path: string, email: string, password: string): Promise<Page> {
  const page = await openPageAsNewClient(browser, { baseURL: test.info().project.use.baseURL });
  await signInAs(page, path, email, password);
  return page;
}

function entryRow(page: Page) {
  return page.getByRole("list", { name: "Entries waiting for you, oldest first" }).getByRole("listitem").filter({ hasText: ENTRY_TEXT });
}

test("the owner sees the team and invites an address, which stays pending", async ({ page }) => {
  await signInAs(page, "/settings", OWNER_EMAIL, OWNER_PASSWORD);
  await page.getByRole("link", { name: "Manage the team" }).click();
  await expect(page.getByRole("heading", { name: "Team", level: 1 })).toBeVisible();

  const members = page.getByRole("list", { name: "Team members" }).getByRole("listitem");
  await expect(members.filter({ hasText: OWNER_EMAIL })).toContainText("Admin");
  await expect(members.filter({ hasText: OWNER_EMAIL })).toContainText("You");
  await expect(members.filter({ hasText: TEAMMATE_EMAIL })).not.toContainText("Admin");

  await page.getByLabel("Email").fill("invitee@example.com");
  await page.getByRole("button", { name: "Send invitation" }).click();
  // Without a mail provider the production build cannot deliver the link: the invitation is kept as pending.
  await expect(page.getByText("The invitation was saved but the mail was not sent. Try Resend.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("invitee@example.com: Pending")).toBeVisible();
});

test("a teammate sees the same projects, answers an entry, and the issue and the inbox name them", async ({ browser, page, request }) => {
  await signInAs(page, "/settings", OWNER_EMAIL, OWNER_PASSWORD);
  await page.getByLabel("Repository").fill(REPOSITORY);
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("status").first()).toContainText(`${REPOSITORY} is now watched.`);
  await page.goto("/scan-status");
  await page.getByRole("button", { name: "Scan now" }).click();
  await expect(page.getByRole("list", { name: "Projects by last read" }).getByRole("listitem").filter({ hasText: REPOSITORY })).toContainText("Read", {
    timeout: 10_000,
  });

  const teammate = await openAs(browser, "/inbox", TEAMMATE_EMAIL, TEAMMATE_PASSWORD);
  await expect(teammate.getByRole("list", { name: "Projects" }).getByRole("link", { name: REPOSITORY })).toBeVisible();
  const row = entryRow(teammate);
  await row.getByRole("group", { name: "Your answer" }).getByRole("button", { name: "Yes" }).click();
  await row.getByRole("button", { name: "Send answer" }).click();
  await expect(row.getByRole("link", { name: "Yes · issue #1" })).toBeVisible();
  await expect(row).toContainText(`by ${TEAMMATE_EMAIL}`);

  const created = await request.get(`http://127.0.0.1:${String(FAKE_FORGE_PORT)}/__issues/${REPOSITORY}`);
  const issues = (await created.json()) as { body: string }[];
  expect(issues).toHaveLength(1);
  expect(issues[0]?.body).toContain("**teammate** answers **Yes**");
  expect(issues[0]?.body).toContain("- Answered by: teammate");
  expect(issues[0]?.body).not.toContain(TEAMMATE_EMAIL);

  // The owner sees who answered too.
  await page.goto("/inbox");
  await expect(entryRow(page)).toContainText(`by ${TEAMMATE_EMAIL}`);

  // Team is the owner's: a teammate gets "not found" and Settings offers no Team section.
  await teammate.goto("/settings");
  await expect(teammate.getByRole("heading", { name: "Settings", level: 1 })).toBeVisible();
  await expect(teammate.getByRole("link", { name: "Manage the team" })).toHaveCount(0);
  const response = await teammate.goto("/settings/team");
  expect(response?.status()).toBe(404);
  await teammate.context().close();
});

test("the owner removes the teammate, whose next request lands on the login page, and their answer keeps their name", async ({ browser, page }) => {
  const teammate = await openAs(browser, "/inbox", TEAMMATE_EMAIL, TEAMMATE_PASSWORD);
  await expect(teammate.getByRole("heading", { name: "Inbox", level: 1 })).toBeVisible();

  await signInAs(page, "/settings/team", OWNER_EMAIL, OWNER_PASSWORD);
  const member = page.getByRole("list", { name: "Team members" }).getByRole("listitem").filter({ hasText: TEAMMATE_EMAIL });
  await member.getByLabel(`Remove ${TEAMMATE_EMAIL}`).click();
  await member.getByRole("button", { name: "Remove from the team" }).click();
  await expect(page.getByText("The teammate was removed from the team.")).toBeVisible();
  await expect(page.getByRole("list", { name: "Team members" }).getByRole("listitem").filter({ hasText: TEAMMATE_EMAIL })).toHaveCount(0);

  await teammate.reload();
  await expect(teammate).toHaveURL(/\/login/);
  await teammate.context().close();

  await page.goto("/inbox");
  await expect(entryRow(page)).toContainText(`by ${TEAMMATE_EMAIL}`);
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("the team screen fits without horizontal scroll", async ({ page }) => {
    await signInAs(page, "/settings/team", OWNER_EMAIL, OWNER_PASSWORD);
    await expect(page.getByRole("heading", { name: "Team", level: 1 })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
