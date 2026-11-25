import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
import { submitRepository } from "./submit-repository.ts";
import { scanUntilSettled } from "./scan-until-settled.ts";

// Shares the database with the other specs: it watches repositories no other spec uses and looks only at their rows.
test.describe.configure({ mode: "serial" });

async function signIn(page: Page, path: string) {
  await page.goto(path);
  await submitLogin(page, { copy: authMessages.en, email: OWNER_EMAIL, password: OWNER_PASSWORD });
}

async function watchAndScan(page: Page, names: readonly string[]) {
  await page.goto("/settings");
  for (const name of names) {
    await submitRepository(page, name);
    await expect(page.getByRole("status").first()).toContainText(`${name} is now watched.`);
  }
  await scanUntilSettled(page, names);
}

function entryRow(page: Page, text: string) {
  return page.getByRole("list", { name: "Entries waiting for you, oldest first" }).getByRole("listitem").filter({ hasText: text });
}

test("an answer with a note becomes one cockpit issue and the entry shows sent with its link", async ({ page, request }) => {
  await signIn(page, "/settings");
  await watchAndScan(page, ["example-org/theta-app", "example-org/iota-app"]);

  await page.goto("/inbox");
  const row = entryRow(page, "Approve the theta-app pricing page");
  await row.getByRole("group", { name: "Your answer" }).getByRole("button", { name: "Yes" }).click();
  await row.getByLabel("Note (optional)").fill("Ship it with the yearly plan.");
  await expect(row).toContainText("Send Yes to example-org/theta-app?");
  await row.getByRole("button", { name: "Send answer" }).click();

  // The page refreshes with the answer: the row now shows "sent" and the issue it became.
  await expect(row.getByRole("link", { name: "Yes · issue #1" })).toBeVisible();
  await page.reload();
  await expect(entryRow(page, "Approve the theta-app pricing page")).toContainText("Sent");
  await expect(entryRow(page, "Approve the theta-app pricing page").getByRole("link", { name: "Yes · issue #1" })).toBeVisible();

  const created = await request.get(`http://127.0.0.1:${String(FAKE_FORGE_PORT)}/__issues/example-org/theta-app`);
  const issues = (await created.json()) as { body: string; labels: string[] }[];
  expect(issues).toHaveLength(1);
  expect(issues[0]?.labels).toEqual(["cockpit"]);
  expect(issues[0]?.body).toContain('<!-- owner-word: {"entry":"oq-theta-1","answer":"yes"} -->');
  expect(issues[0]?.body).toContain("> Ship it with the yearly plan.");
});

test("a project without the cockpit or owner-word label shows why and the entry stays unanswered", async ({ page, request }) => {
  await signIn(page, "/inbox");
  const row = entryRow(page, "Confirm the iota-app import format");
  await row.getByRole("button", { name: "Later" }).click();
  await row.getByRole("button", { name: "Send answer" }).click();

  await expect(row.getByRole("status").last()).toContainText("The project has no cockpit label (nor the older owner-word), so no issue was created.");
  await page.reload();
  await expect(entryRow(page, "Confirm the iota-app import format").getByRole("group", { name: "Your answer" })).toBeVisible();
  const created = await request.get(`http://127.0.0.1:${String(FAKE_FORGE_PORT)}/__issues/example-org/iota-app`);
  expect(await created.json()).toEqual([]);
});

test.describe("on a 390 px phone", () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test("every answer control is at least 44 px high and nothing scrolls sideways", async ({ page }) => {
    await signIn(page, "/inbox");
    const row = entryRow(page, "Confirm the iota-app import format");
    const choices = row.getByRole("group", { name: "Your answer" }).getByRole("button");
    await expect(choices).toHaveCount(3);
    for (const box of await Promise.all((await choices.all()).map((button) => button.boundingBox()))) {
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    await choices.first().click();
    for (const name of ["Send answer", "Back"]) {
      const box = await row.getByRole("button", { name }).boundingBox();
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
