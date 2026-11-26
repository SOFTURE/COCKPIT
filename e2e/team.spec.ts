import type { Browser, Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, openPageAsNewClient, submitLogin, test } from "@softure-ai/testing/playwright";
import { expectStateInRightColumn } from "./expect-row-state.ts";
import { FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD, TEAMMATE_EMAIL, TEAMMATE_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";
import { expectListEntryRows } from "./expect-list-entry-rows.ts";

// Teammates (FR-16). Shares the database with the other specs: it watches a repository no other spec uses, invites an
// address no other spec uses, and is the only spec that signs in as the teammate (and removes them at the end).
test.describe.configure({ mode: "serial" });

const REPOSITORY = "example-org/teamwork-app";
const ENTRY_TEXT = "Approve the teamwork-app onboarding copy";

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
  await expectStateInRightColumn(page, members.filter({ hasText: OWNER_EMAIL }), "Admin");
  await expectListEntryRows(page, page.getByRole("list", { name: "Team members" }), "24-team");
  await expect(members.filter({ hasText: TEAMMATE_EMAIL })).not.toContainText("Admin");

  // Members and Invite are tabs; the invitation form sits in Invite.
  await expect(page.getByRole("navigation", { name: "Team sections" }).getByRole("link", { name: /^Members \d+$/ })).toHaveAttribute("aria-current", "page");
  await page.getByRole("navigation", { name: "Team sections" }).getByRole("link", { name: "Invite" }).click();
  await expect(page).toHaveURL(/\/settings\/team\?tab=invite$/);
  await page.getByLabel("Email").fill("invitee@example.com");
  await page.getByRole("button", { name: "Send invitation" }).click();
  // Without a mail provider the production build cannot deliver the link: the invitation is kept as pending.
  await expect(page.getByText("The invitation was saved but the mail was not sent. Try Resend.")).toBeVisible();
  await page.reload();
  await expect(page.getByText("invitee@example.com: Pending")).toBeVisible();
});

test("the owner revokes a pending invitation only after confirming it", async ({ page }) => {
  const email = "revokee@example.com";
  await signInAs(page, "/settings/team?tab=invite", OWNER_EMAIL, OWNER_PASSWORD);
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Send invitation" }).click();
  await expect(page.getByText("The invitation was saved but the mail was not sent. Try Resend.")).toBeVisible();
  await page.reload();
  const invitation = page.getByRole("region", { name: "Sent invitations" }).getByRole("listitem").filter({ hasText: `${email}: Pending` });
  await expect(invitation).toHaveCount(1);

  // Cancel closes the confirmation and keeps the invitation pending.
  await invitation.getByRole("button", { name: "Revoke" }).click();
  const confirm = page.getByRole("dialog", { name: `Revoke the invitation for ${email}?` });
  await expect(confirm).toContainText("The invitation link stops working. You can send a new invitation later.");
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(invitation).toHaveCount(1);

  await invitation.getByRole("button", { name: "Revoke" }).click();
  await confirm.getByRole("button", { name: "Revoke", exact: true }).click();
  await expect(page.getByText("The invitation was revoked. Its link no longer works.")).toBeVisible();
  await expect(page.getByText(`${email}: Revoked`)).toBeVisible();
  await expect(page.getByText(`${email}: Pending`)).toHaveCount(0);
});

test("a teammate sees the same projects, answers an entry, and the issue and the inbox name them", async ({ browser, page, request }) => {
  await signInAs(page, "/settings", OWNER_EMAIL, OWNER_PASSWORD);
  await submitRepository(page, REPOSITORY);
  await expect(page.getByRole("status").first()).toContainText(`${REPOSITORY} is now watched.`);
  await scanUntilSettled(page, [REPOSITORY]);

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
  // Cancel closes the confirmation dialog and keeps the teammate.
  await member.getByRole("button", { name: `Remove ${TEAMMATE_EMAIL}` }).click();
  const confirm = page.getByRole("alertdialog", { name: `Remove ${TEAMMATE_EMAIL} from the team?` });
  await expect(confirm).toContainText("Their account and sessions end at once; their answers keep their name.");
  await confirm.getByRole("button", { name: "Cancel" }).click();
  await expect(confirm).toHaveCount(0);
  await expect(member).toHaveCount(1);

  await member.getByRole("button", { name: `Remove ${TEAMMATE_EMAIL}` }).click();
  await confirm.getByRole("button", { name: "Remove", exact: true }).click();
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
