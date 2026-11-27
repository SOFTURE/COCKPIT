import type { Page } from "@playwright/test";
import { authMessages } from "@softure-ai/auth";
import { expect, submitLogin, test } from "@softure-ai/testing/playwright";
import { E2E_FORGE_TOKEN, FAKE_FORGE_PORT, OWNER_EMAIL, OWNER_PASSWORD } from "./fixtures.ts";
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
  expect(issues[0]?.body).toContain('<!-- cockpit: {"entry":"oq-theta-1","answer":"yes"} -->');
  expect(issues[0]?.body).toContain("> Ship it with the yearly plan.");
});

test("a project without the cockpit label shows why and the entry stays unanswered", async ({ page, request }) => {
  await signIn(page, "/inbox");
  const row = entryRow(page, "Confirm the iota-app import format");
  await row.getByRole("button", { name: "Later" }).click();
  await row.getByRole("button", { name: "Send answer" }).click();

  await expect(row.getByRole("status").last()).toContainText("The project has no cockpit label, so no issue was created.");
  await page.reload();
  await expect(entryRow(page, "Confirm the iota-app import format").getByRole("group", { name: "Your answer" })).toBeVisible();
  const created = await request.get(`http://127.0.0.1:${String(FAKE_FORGE_PORT)}/__issues/example-org/iota-app`);
  expect(await created.json()).toEqual([]);
});

test("an answer turns done once its issue is closed, even after the issue lost the cockpit label", async ({ page, request }) => {
  await signIn(page, "/settings");
  await watchAndScan(page, ["example-org/closure-app"]);

  await page.goto("/inbox");
  const row = entryRow(page, "Approve the closure-app retention policy");
  await row.getByRole("group", { name: "Your answer" }).getByRole("button", { name: "Yes" }).click();
  await row.getByRole("button", { name: "Send answer" }).click();
  await expect(row.getByRole("link", { name: "Yes · issue #1" })).toBeVisible();

  // The owner takes the cockpit label off and closes the issue: the labelled list no longer holds it (#166).
  const forge = `http://127.0.0.1:${String(FAKE_FORGE_PORT)}`;
  expect((await request.post(`${forge}/__issues/example-org/closure-app/1/close`)).status()).toBe(200);
  const listed = await request.get(`${forge}/repos/example-org/closure-app/issues?labels=cockpit`, { headers: { authorization: `Bearer ${E2E_FORGE_TOKEN}` } });
  expect(await listed.json()).toEqual([]);

  // The next scan reads the issue by its number and the answer is done.
  test.info().setTimeout(test.info().timeout + 40_000);
  await expect(async () => {
    await page.goto("/scan-status");
    await page.getByRole("button", { name: "Scan now" }).click();
    await page.goto("/inbox");
    const answered = entryRow(page, "Approve the closure-app retention policy");
    await expect(answered.getByText("Done", { exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(answered.getByRole("link", { name: "Yes · issue #1" })).toBeVisible();
  }).toPass({ intervals: [1_000], timeout: 40_000 });
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
